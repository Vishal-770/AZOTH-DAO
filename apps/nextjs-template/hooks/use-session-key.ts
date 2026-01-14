"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { privateKeyToAccount } from "viem/accounts";
import {
  generateSecp256k1Keypair,
  getConfig,
  DEFAULT_SESSION_VERIFIER,
  type SessionKeyVoucher,
} from "@/utils/inco";
import { toSecp256k1Keypair } from "@inco/js/lite";
import type { Secp256k1Keypair } from "@inco/js/lite";
import elliptic from "elliptic";

const EC = elliptic.ec;

interface StoredSessionData {
  privateKeyHex: string;
  voucher: SessionKeyVoucher;
  expiresAt: string; // ISO date string
}

export interface SessionData {
  keypair: Secp256k1Keypair;
  voucher: SessionKeyVoucher;
  expiresAt: Date;
}

const SESSION_DURATION_MS = 3600000; // 1 hour

export function useSessionKey() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get localStorage key for current address
  const getStorageKey = useCallback((walletAddress: string) => {
    return `azoth_session_${walletAddress.toLowerCase()}`;
  }, []);

  // Save session to localStorage
  const saveSessionToStorage = useCallback((session: SessionData, walletAddress: string) => {
    try {
      const key = getStorageKey(walletAddress);
      const toStore: StoredSessionData = {
        privateKeyHex: session.keypair.kp.getPrivate('hex'),
        voucher: session.voucher,
        expiresAt: session.expiresAt.toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(toStore));
      console.log("[SessionKey] Saved to localStorage");
    } catch (err) {
      console.error("[SessionKey] Failed to save to localStorage:", err);
    }
  }, [getStorageKey]);

  // Load session from localStorage
  const loadSessionFromStorage = useCallback((walletAddress: string): SessionData | null => {
    try {
      const key = getStorageKey(walletAddress);
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        console.log("[SessionKey] No stored session found");
        return null;
      }

      const parsed: StoredSessionData = JSON.parse(stored);
      const expiresAt = new Date(parsed.expiresAt);

      // Check if expired
      if (new Date() >= expiresAt) {
        console.log("[SessionKey] Stored session expired, removing...");
        localStorage.removeItem(key);
        return null;
      }

      // Reconstruct keypair from stored private key using elliptic library
      const secp256k1 = new EC('secp256k1');
      const kp = secp256k1.keyFromPrivate(parsed.privateKeyHex, 'hex');
      
      // Convert to Inco Secp256k1Keypair format
      const keypair = toSecp256k1Keypair(kp);

      console.log("[SessionKey] Loaded valid session from localStorage");
      return {
        keypair,
        voucher: parsed.voucher,
        expiresAt,
      };
    } catch (err) {
      console.error("[SessionKey] Failed to load from localStorage:", err);
      return null;
    }
  }, [getStorageKey]);

  // Load session on mount or when address changes
  useEffect(() => {
    if (!address) {
      setSessionData(null);
      return;
    }

    const stored = loadSessionFromStorage(address);
    if (stored) {
      setSessionData(stored);
    }
  }, [address, loadSessionFromStorage]);

  // Create a new session key
  const createSession = useCallback(async () => {
    if (!walletClient || !address) {
      console.log("[SessionKey] Missing wallet client or address");
      return null;
    }

    setIsCreatingSession(true);
    setError(null);

    try {
      console.log("[SessionKey] Creating new session key...");
      
      // Generate ephemeral keypair for this session
      const ephemeralKeypair = generateSecp256k1Keypair();
      
      // Derive Ethereum account from private key
      const ephemeralAccount = privateKeyToAccount(
        `0x${ephemeralKeypair.kp.getPrivate('hex')}` as `0x${string}`
      );
      const granteeAddress = ephemeralAccount.address;
      
      console.log("[SessionKey] Ephemeral address:", granteeAddress);
      
      // Session valid for 1 hour
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
      
      const inco = await getConfig();
      
      // User signs ONCE to grant session key
      const voucher = await inco.grantSessionKeyAllowanceVoucher(
        walletClient,
        granteeAddress,
        expiresAt,
        DEFAULT_SESSION_VERIFIER
      ) as SessionKeyVoucher;

      const newSession: SessionData = {
        keypair: ephemeralKeypair,
        voucher,
        expiresAt,
      };

      setSessionData(newSession);
      saveSessionToStorage(newSession, address);

      console.log("[SessionKey] Session created! Valid until:", expiresAt.toISOString());
      return newSession;
    } catch (err: unknown) {
      console.error("[SessionKey] Failed to create session:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to create session";
      setError(errorMsg);
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  }, [walletClient, address, saveSessionToStorage]);

  // Check if session is still valid
  const isSessionValid = useMemo(() => {
    if (!sessionData) return false;
    return new Date() < sessionData.expiresAt;
  }, [sessionData]);

  // Get or create session (auto-creates if needed)
  const ensureSession = useCallback(async (): Promise<SessionData | null> => {
    if (isSessionValid && sessionData) {
      return sessionData;
    }
    return await createSession();
  }, [isSessionValid, sessionData, createSession]);

  return {
    sessionData,
    isSessionValid,
    isCreatingSession,
    error,
    createSession,
    ensureSession,
  };
}
