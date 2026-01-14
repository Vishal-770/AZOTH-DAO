"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatUnits } from "viem";
import {
  CONFIDENTIAL_VAULT_ADDRESS,
  CONFIDENTIAL_VAULT_ABI,
  CUSDC_MARKETPLACE_ADDRESS,
  CUSDC_MARKETPLACE_ABI,
} from "@/utils/constants";
import { getConfig } from "@/utils/inco";
import { useSessionKey } from "@/hooks/use-session-key";

const ConfidentialVault = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [shares, setShares] = useState<string | null>(null);
  const [cUSDCBalance, setCUSDCBalance] = useState<string | null>(null);
  const [hasSharesOnChain, setHasSharesOnChain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use shared session key hook
  const { sessionData, isSessionValid, isCreatingSession, ensureSession } = useSessionKey();

  useEffect(() => {
    const checkShares = async () => {
      if (!publicClient || !address) return;
      try {
        const hasShares = await publicClient.readContract({
          address: CONFIDENTIAL_VAULT_ADDRESS,
          abi: CONFIDENTIAL_VAULT_ABI,
          functionName: "hasShares",
          args: [address],
        }) as boolean;
        setHasSharesOnChain(hasShares);
      } catch (err) {
        console.error("Failed to check shares:", err);
      }
    };
    checkShares();
  }, [publicClient, address]);

  const handleGetBalances = async () => {
    if (!publicClient || !address) {
      console.log("[Vault] Missing dependencies for balance check");
      return;
    }

    // Ensure we have a valid session (auto-creates if needed)
    const session = await ensureSession();
    if (!session) {
      setError("Failed to create session key");
      return;
    }

    setIsDecrypting(true);
    setError(null);
    
    console.log("[Vault] Fetching balances for:", address);

    try {
      // Get both handles first
      console.log("[Vault] Getting cUSDC handle...");
      const cUSDCHandle = (await publicClient.readContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as `0x${string}`;

      console.log("[Vault] Getting shares handle...");
      const sharesHandle = (await publicClient.readContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "shares",
        args: [address],
      })) as `0x${string}`;

      // Prepare handles array (filter out zero handles)
      const handlesToDecrypt: `0x${string}`[] = [];
      const handleMap = { cUSDC: -1, shares: -1 };
      const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

      if (cUSDCHandle !== ZERO_HANDLE) {
        handleMap.cUSDC = handlesToDecrypt.length;
        handlesToDecrypt.push(cUSDCHandle);
      }
      
      if (sharesHandle !== ZERO_HANDLE) {
        handleMap.shares = handlesToDecrypt.length;
        handlesToDecrypt.push(sharesHandle);
      }

      // Batch decrypt with session key - NO NEW SIGNATURE NEEDED!
      if (handlesToDecrypt.length > 0 && session) {
        console.log("[Vault] Batch decrypting", handlesToDecrypt.length, "handles with session key (no signature)...");
        
        const inco = await getConfig();

        // Use session key voucher - NO wallet signature popup!
        const results: Array<{ plaintext: { value: bigint | boolean } }> = await (inco.attestedDecryptWithVoucher as (
          kp: typeof session.keypair,
          v: typeof session.voucher,
          pc: typeof publicClient,
          h: `0x${string}`[]
        ) => Promise<Array<{ plaintext: { value: bigint | boolean } }>>)(
          session.keypair,
          session.voucher,
          publicClient,
          handlesToDecrypt
        );

        // Extract values from batch result
        if (handleMap.cUSDC !== -1) {
          const decryptedCUSDC = results[handleMap.cUSDC].plaintext.value as bigint;
          console.log("[Vault] cUSDC balance:", formatUnits(decryptedCUSDC, 6));
          setCUSDCBalance(formatUnits(decryptedCUSDC, 6));
        } else {
          setCUSDCBalance("0");
        }

        if (handleMap.shares !== -1) {
          const decryptedShares = results[handleMap.shares].plaintext.value as bigint;
          console.log("[Vault] Shares balance:", formatUnits(decryptedShares, 18));
          setShares(formatUnits(decryptedShares, 18));
        } else {
          setShares("0");
        }
      } else if (handlesToDecrypt.length === 0) {
        // Both handles are zero
        console.log("[Vault] Both handles are zero");
        setCUSDCBalance("0");
        setShares("0");
      }
    } catch (err: unknown) {
      console.error("[Vault] Failed to get balances:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: Inco hasn't processed the ACL yet. Wait a few seconds and try again.");
      } else {
        setError(`Failed to decrypt balances: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDepositAll = async () => {
    if (!publicClient || !walletClient || !address) return;

    setIsDepositing(true);
    setError(null);
    setTxHash(null);

    try {
      // Check if user has cUSDC balance before depositing
      const cUSDCHandle = (await publicClient.readContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "balanceOf",
        args: [address],
      })) as `0x${string}`;

      if (cUSDCHandle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        setError("No cUSDC balance to deposit");
        return;
      }

      // Deposit now takes no arguments - it uses stored balance in marketplace
      const hash = await walletClient.writeContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "deposit",
        args: [],
      });

      setTxHash(hash);

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        setHasSharesOnChain(true);
      }
    } catch (err: unknown) {
      console.error("Deposit failed:", err);
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdrawAll = async () => {
    if (!publicClient || !walletClient || !address) return;

    setIsWithdrawing(true);
    setError(null);
    setTxHash(null);

    try {
      const hasShares = await publicClient.readContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "hasShares",
        args: [address],
      }) as boolean;

      if (!hasShares) {
        setError("No shares to withdraw. Make sure you deposited to this vault.");
        return;
      }

      console.log("[Vault] Calling withdrawAll...");
      const hash = await walletClient.writeContract({
        address: CONFIDENTIAL_VAULT_ADDRESS,
        abi: CONFIDENTIAL_VAULT_ABI,
        functionName: "withdrawAll",
        args: [],
      });

      console.log("[Vault] Withdraw tx:", hash);
      setTxHash(hash);

      if (publicClient) {
        console.log("[Vault] Waiting for confirmation...");
        await publicClient.waitForTransactionReceipt({ hash });
        console.log("[Vault] Withdraw confirmed!");
        setHasSharesOnChain(false);
      }
    } catch (err: unknown) {
      console.error("[Vault] Withdraw failed:", err);
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 md:px-8 pb-16">
      <div className="max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#00f5ff]/30 pb-6 gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight uppercase">Confidential Vault</h2>
          <p className="font-mono text-xs text-[#e0f2fe]/50 tracking-wider mt-1">ERC-4626 vault with inflation protection</p>
        </div>
        <span
          className={`px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase border transition-all text-center ${
            hasSharesOnChain
              ? "bg-[#00f5ff]/10 text-[#00f5ff] border-[#00f5ff]/40"
              : "bg-black/40 text-[#e0f2fe]/40 border-[#e0f2fe]/10"
          }`}
        >
          {hasSharesOnChain ? "Has Shares" : "No Shares"}
        </span>
      </div>

      {/* Session Status Indicator */}
      <div className="bg-black/40 p-4 border border-[#e0f2fe]/20">
        <div>
          <p className="font-mono text-[10px] text-[#e0f2fe]/50 tracking-widest uppercase">
            Session Status
          </p>
          <p className="font-mono text-sm text-white mt-1">
            {isSessionValid ? (
              <span className="text-[#00f5ff]">
                ✓ Active (expires {sessionData?.expiresAt.toLocaleTimeString()})
              </span>
            ) : (
              <span className="text-yellow-400">No Active Session - Will create on first decrypt</span>
            )}
          </p>
        </div>
      </div>

      {/* Balances Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-black/40 p-4 sm:p-6 border border-[#e0f2fe]/20">
          <p className="font-mono text-[10px] text-[#e0f2fe]/50 tracking-widest uppercase mb-3">cUSDC Balance</p>
          <p className="font-display text-xl sm:text-2xl font-bold text-white break-all">
            {cUSDCBalance !== null ? (
              parseFloat(cUSDCBalance).toFixed(2)
            ) : (
              <span className="text-[#00f5ff] flex items-center space-x-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </p>
        </div>
        <div className="bg-black/40 p-4 sm:p-6 border border-[#00f5ff]/20">
          <p className="font-mono text-[10px] text-[#e0f2fe]/50 tracking-widest uppercase mb-3">Vault Shares</p>
          <p className="font-display text-xl sm:text-2xl font-bold text-white break-all">
            {shares !== null ? (
              parseFloat(shares).toFixed(4)
            ) : (
              <span className="text-[#00f5ff] flex items-center space-x-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </p>
        </div>
      </div>

      <button
        onClick={handleGetBalances}
        disabled={isDecrypting || isCreatingSession || !address}
        className="w-full py-3 bg-black/60 text-[#e0f2fe] border border-[#e0f2fe]/20 font-mono text-xs tracking-widest hover:bg-black/80 hover:border-[#00f5ff]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
      >
        {isCreatingSession 
          ? "Creating Session (Sign Once)..." 
          : isDecrypting 
            ? "Decrypting..." 
            : isSessionValid
              ? "Reveal All Balances (No Signature)"
              : "Reveal All Balances (Create Session)"}
      </button>

      {/* Info about session keys */}
      {!isSessionValid && (
        <div className="bg-[#e0f2fe]/5 border border-[#e0f2fe]/30 p-4 relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#e0f2fe]"></div>
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#e0f2fe]"></div>
          <p className="font-mono text-xs text-[#e0f2fe] leading-relaxed">
            <span className="text-white font-bold">{'>>'} Session Key:</span> Sign once to create a session, 
            then decrypt balances multiple times without repeated signatures. Session expires in 1 hour.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-5">
        <button
          onClick={handleDepositAll}
          disabled={isDepositing || !address}
          className="py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-mono font-bold text-xs tracking-[0.3em] hover:bg-[#00f5ff]/20 hover:border-[#00f5ff] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase relative overflow-hidden group/btn"
        >
          <div className="absolute inset-0 bg-[#00f5ff]/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10">{isDepositing ? "Depositing..." : "Deposit All cUSDC"}</span>
        </button>

        <button
          onClick={handleWithdrawAll}
          disabled={isWithdrawing || !address}
          className="py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold text-xs tracking-[0.3em] hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
        >
          {isWithdrawing ? "Withdrawing..." : "Ragequit"}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-[#e0f2fe]/5 border border-[#e0f2fe]/30 p-4 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#e0f2fe]"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#e0f2fe]"></div>
        <p className="font-mono text-xs text-[#e0f2fe] leading-relaxed">
          <span className="text-white font-bold">{'>>'} Ragequit:</span> You can withdraw your proportional share of
          the vault at any time, including during proposal queue periods.
        </p>
      </div>

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-[#00f5ff]/10 border border-[#00f5ff]/40 p-4 animate-pulse">
          <p className="font-mono text-sm font-medium text-[#00f5ff] mb-2">Transaction Successful!</p>
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[#00f5ff]/80 hover:text-[#00f5ff] transition-colors"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 p-4">
          <p className="font-mono text-xs text-red-400 leading-relaxed">{error}</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default ConfidentialVault;
