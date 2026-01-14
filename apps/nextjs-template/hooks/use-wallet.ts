"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useChainId } from "wagmi";

/**
 * Hook to access wallet and authentication state from Privy
 * 
 * @example
 * ```tsx
 * const { address, isConnected, isLoading, login, logout } = useWallet();
 * ```
 */
export function useWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const chainId = useChainId();

  // Get the first connected wallet
  const wallet = wallets[0];
  const privyAddress = wallet?.address;

  // Prefer wagmi address if available, fallback to privy
  const address = wagmiAddress || (privyAddress as `0x${string}` | undefined);

  return {
    // Connection state
    isLoading: !ready,
    isConnected: authenticated && (wagmiConnected || !!privyAddress),
    
    // Address info
    address,
    shortAddress: address 
      ? `${address.slice(0, 6)}...${address.slice(-4)}` 
      : undefined,
    
    // Chain info
    chainId,
    
    // User info (from Privy)
    user,
    email: user?.email?.address,
    
    // Actions
    login,
    logout,
    
    // Raw wallet object for advanced usage
    wallet,
    wallets,
  };
}
