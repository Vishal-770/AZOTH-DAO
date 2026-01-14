"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatUnits } from "viem";
import { CUSDC_MARKETPLACE_ADDRESS, CUSDC_MARKETPLACE_ABI } from "@/utils/constants";
import { getConfig } from "@/utils/inco";
import { useSessionKey } from "@/hooks/use-session-key";

const CUSDCMarketplace = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [ethAmount, setEthAmount] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use shared session key hook
  const { ensureSession } = useSessionKey();

  const expectedCUSDC = ethAmount ? (parseFloat(ethAmount) * 2000).toFixed(2) : "0";

  const handlePurchase = async () => {
    if (!walletClient || !address || !ethAmount) {
      console.log("[CUSDCMarketplace] Missing dependencies for purchase");
      return;
    }
    
    setIsPurchasing(true);
    setError(null);
    setTxHash(null);
    
    console.log("[CUSDCMarketplace] Starting purchase...");
    console.log("[CUSDCMarketplace] ETH amount:", ethAmount);
    console.log("[CUSDCMarketplace] Expected cUSDC:", expectedCUSDC);
    
    try {
      const hash = await walletClient.writeContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "purchaseCUSDC",
        value: parseEther(ethAmount),
      });
      
      console.log("[CUSDCMarketplace] Transaction submitted:", hash);
      setTxHash(hash);
      setEthAmount("");
      
      if (publicClient) {
        console.log("[CUSDCMarketplace] Waiting for confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("[CUSDCMarketplace] Confirmed in block:", receipt.blockNumber);
        
        console.log("[CUSDCMarketplace] Waiting 20s for Inco to process operations...");
        setError("Purchase confirmed! Waiting ~20s for Inco to process encrypted operations...");
        await new Promise(resolve => setTimeout(resolve, 20000));
        setError(null);
        console.log("[CUSDCMarketplace] Wait complete. You can now reveal your balance!");
      }
    } catch (err: unknown) {
      console.error("[CUSDCMarketplace] Purchase failed:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleGetBalance = async () => {
    if (!publicClient || !address) {
      console.log("[CUSDCMarketplace] Missing dependencies");
      return;
    }
    
    setIsDecrypting(true);
    setError(null);
    
    console.log("[CUSDCMarketplace] Fetching balance for:", address);
    
    try {
      // Ensure we have a valid session
      const session = await ensureSession();
      if (!session) {
        setError("Failed to create session key");
        return;
      }

      try {
        const isAllowed = await publicClient.readContract({
          address: CUSDC_MARKETPLACE_ADDRESS,
          abi: CUSDC_MARKETPLACE_ABI,
          functionName: "checkBalanceACL",
          args: [address],
        }) as boolean;
        console.log("[CUSDCMarketplace] ACL check result:", isAllowed);
        
        if (!isAllowed) {
          setError("ACL not ready. Inco may still be processing your transaction. Please wait and try again.");
          return;
        }
      } catch (aclErr) {
        console.log("[CUSDCMarketplace] ACL check not available:", aclErr);
      }

      const handle = await publicClient.readContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "balanceOf",
        args: [address],
      }) as `0x${string}`;
      
      console.log("[CUSDCMarketplace] Got handle:", handle);
      
      if (handle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        setBalance("0");
        return;
      }
      
      // Decrypt using session key
      const inco = await getConfig();
      const results: Array<{ plaintext: { value: bigint | boolean } }> = await (inco.attestedDecryptWithVoucher as (
        kp: typeof session.keypair,
        v: typeof session.voucher,
        pc: typeof publicClient,
        h: `0x${string}`[]
      ) => Promise<Array<{ plaintext: { value: bigint | boolean } }>>)(
        session.keypair,
        session.voucher,
        publicClient,
        [handle]
      );
      
      const decrypted = results[0].plaintext.value as bigint;
      const formattedBalance = formatUnits(decrypted, 6);
      console.log("[CUSDCMarketplace] Decrypted balance:", formattedBalance);
      setBalance(formattedBalance);
    } catch (err: unknown) {
      console.error("[CUSDCMarketplace] Failed to get balance:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: Inco hasn't finished processing. Please wait 30-60 seconds and try again.");
      } else {
        setError(`Failed to decrypt balance: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 md:px-12 lg:px-24 pb-12">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="border-b-2 border-[#00f5ff]/30 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase mb-2">
                cUSDC Marketplace
              </h1>
              <p className="font-mono text-xs sm:text-sm text-[#e0f2fe]/60 tracking-wider">Exchange ETH for Confidential USDC</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-xs text-[#e0f2fe]/50 tracking-widest uppercase">Exchange Rate</p>
              <p className="font-mono text-lg sm:text-xl font-semibold text-[#00f5ff] mt-2 whitespace-nowrap">1 ETH = 2,000 cUSDC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-8">

      {/* Balance Display */}
      <div className="bg-gradient-to-br from-[#00f5ff]/5 to-transparent border-l-4 border-[#00f5ff] p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs sm:text-sm text-[#e0f2fe]/60 tracking-widest uppercase mb-3">Your cUSDC Balance</p>
            <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">
              {balance !== null ? (
                <span className="break-all">{parseFloat(balance).toFixed(2)} <span className="text-[#00f5ff]">cUSDC</span></span>
              ) : (
                <span className="text-[#00f5ff] flex items-center space-x-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono text-base sm:text-lg">Encrypted</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleGetBalance}
            disabled={isDecrypting || !address}
            className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-mono text-xs sm:text-sm tracking-widest hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase whitespace-nowrap"
          >
            {isDecrypting ? "Decrypting..." : "Reveal"}
          </button>
        </div>
      </div>

      {/* Purchase Form */}
      <div className="space-y-6">
        <div>
          <label className="block font-mono text-sm font-medium text-[#e0f2fe]/70 mb-3 tracking-widest uppercase">
            ETH Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              min="0"
              placeholder="0.01"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="w-full bg-black/60 border-l-4 border-[#00f5ff] px-6 py-4 text-white font-mono text-lg focus:outline-none focus:bg-black/80 transition-all pr-20"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[#e0f2fe]/50 font-mono text-base">
              ETH
            </span>
          </div>
        </div>

        {ethAmount && (
          <div className="bg-gradient-to-br from-[#00f5ff]/5 to-transparent border-l-4 border-[#00f5ff] p-4 sm:p-6 animate-pulse">
            <p className="font-mono text-xs sm:text-sm text-[#00f5ff]/80 tracking-wider">You will receive approximately:</p>
            <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-[#00f5ff] mt-2 break-all">{parseFloat(expectedCUSDC).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} cUSDC</p>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={isPurchasing || !ethAmount || !address}
          className="w-full py-5 bg-[#00f5ff]/10 border-l-4 border-[#00f5ff] text-[#00f5ff] font-mono font-bold text-base tracking-[0.3em] hover:bg-[#00f5ff]/20 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
        >
          {isPurchasing ? "Purchasing..." : "Purchase cUSDC"}
        </button>
      </div>

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-gradient-to-br from-[#00f5ff]/5 to-transparent border-l-4 border-[#00f5ff] p-6 animate-pulse">
          <p className="font-mono text-base font-medium text-[#00f5ff] mb-2">Purchase Successful!</p>
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-[#00f5ff]/80 hover:text-[#00f5ff] transition-colors"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-br from-red-500/5 to-transparent border-l-4 border-red-500 p-6">
          <p className="font-mono text-sm text-red-400 leading-relaxed">{error}</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default CUSDCMarketplace;
