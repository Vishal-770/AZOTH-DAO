"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, formatEther, formatUnits } from "viem";
import { CGOV_TOKEN_ADDRESS, CGOV_TOKEN_ABI } from "@/utils/constants";
import { getConfig } from "@/utils/inco";
import { useSessionKey } from "@/hooks/use-session-key";

const CGOVToken = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [ethAmount, setEthAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [mintPrice, setMintPrice] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use shared session key hook
  const { ensureSession } = useSessionKey();

  useEffect(() => {
    const fetchMintPrice = async () => {
      if (!publicClient) return;
      try {
        const price = await publicClient.readContract({
          address: CGOV_TOKEN_ADDRESS,
          abi: CGOV_TOKEN_ABI,
          functionName: "mintPrice",
        }) as bigint;
        setMintPrice(price);
      } catch (err) {
        console.error("Failed to fetch mint price:", err);
      }
    };
    fetchMintPrice();
  }, [publicClient]);

  const expectedCGOV = ethAmount && mintPrice 
    ? (parseFloat(ethAmount) / parseFloat(formatEther(mintPrice))).toFixed(2)
    : "0";

  const handleMint = async () => {
    if (!walletClient || !address || !ethAmount) {
      console.log("[CGOVToken] Missing dependencies for mint");
      return;
    }
    
    setIsMinting(true);
    setError(null);
    setTxHash(null);
    
    console.log("[CGOVToken] Starting mint...");
    console.log("[CGOVToken] ETH amount:", ethAmount);
    console.log("[CGOVToken] Expected cGOV:", expectedCGOV);
    
    try {
      const hash = await walletClient.writeContract({
        address: CGOV_TOKEN_ADDRESS,
        abi: CGOV_TOKEN_ABI,
        functionName: "mint",
        value: parseEther(ethAmount),
      });
      
      console.log("[CGOVToken] Transaction submitted:", hash);
      setTxHash(hash);
      setEthAmount("");
      
      if (publicClient) {
        console.log("[CGOVToken] Waiting for confirmation...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("[CGOVToken] Confirmed in block:", receipt.blockNumber);
      }
    } catch (err: unknown) {
      console.error("[CGOVToken] Mint failed:", err);
      setError(err instanceof Error ? err.message : "Minting failed");
    } finally {
      setIsMinting(false);
    }
  };

  const handleGetBalance = async () => {
    if (!publicClient || !address) {
      console.log("[CGOVToken] Missing dependencies for balance check");
      return;
    }
    
    setIsDecrypting(true);
    setError(null);
    
    console.log("[CGOVToken] Fetching balance for:", address);
    
    try {
      // Ensure we have a valid session
      const session = await ensureSession();
      if (!session) {
        setError("Failed to create session key");
        return;
      }

      const handle = await publicClient.readContract({
        address: CGOV_TOKEN_ADDRESS,
        abi: CGOV_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      }) as `0x${string}`;
      
      console.log("[CGOVToken] Got handle:", handle);
      
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
      const formattedBalance = formatUnits(decrypted, 18);
      console.log("[CGOVToken] Balance:", formattedBalance);
      setBalance(formattedBalance);
    } catch (err: unknown) {
      console.error("[CGOVToken] Failed to get balance:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("acl disallowed")) {
        setError("ACL Error: You don't have permission to decrypt. Have you minted cGOV tokens?");
      } else {
        setError(`Failed to decrypt balance: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 md:px-8 pb-16">
      <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#00f5ff]/30 pb-6 gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight uppercase">cGOV Governance Token</h2>
          <p className="font-mono text-xs text-[#e0f2fe]/50 tracking-wider mt-1">Mint tokens for voting power</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-mono text-[9px] text-[#e0f2fe]/40 tracking-widest uppercase">Mint Price</p>
          <p className="font-mono font-semibold text-[#00f5ff] mt-1 text-sm sm:text-base truncate">
            {mintPrice ? `${parseFloat(formatEther(mintPrice)).toFixed(4)} ETH/token` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-black/40 border border-[#00f5ff]/30 p-4 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] text-[#e0f2fe]/50 tracking-widest uppercase mb-2">Your cGOV Balance (Voting Power)</p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-white break-words">
              {balance !== null ? (
                <span className="break-all">{parseFloat(balance).toFixed(4)} <span className="text-[#00f5ff]">cGOV</span></span>
              ) : (
                <span className="text-[#00f5ff] flex items-center space-x-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono text-base">Encrypted</span>
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleGetBalance}
            disabled={isDecrypting || !address}
            className="px-4 sm:px-6 py-3 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-mono text-xs tracking-widest hover:bg-[#00f5ff]/20 hover:border-[#00f5ff]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase whitespace-nowrap"
          >
            {isDecrypting ? "Decrypting..." : "Reveal"}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[#00f5ff]/5 border border-[#00f5ff]/30 p-4 relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f5ff]"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f5ff]"></div>
        <p className="font-mono text-xs text-[#00f5ff] leading-relaxed">
          <span className="text-white font-bold">{'>>'} Non-transferable:</span> cGOV tokens are soulbound to your address. 
          They grant voting power but have no economic value.
        </p>
      </div>

      {/* Mint Form */}
      <div className="space-y-5">
        <div>
          <label className="block font-mono text-[10px] font-medium text-[#e0f2fe]/60 mb-2 tracking-widest uppercase">
            ETH Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              min="0"
              placeholder="0.001"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="w-full bg-black/60 border border-[#e0f2fe]/20 px-4 py-3 text-white font-mono focus:outline-none focus:border-[#00f5ff]/50 focus:bg-black/80 transition-all pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#e0f2fe]/40 font-mono text-sm">
              ETH
            </span>
          </div>
        </div>

        {ethAmount && (
          <div className="bg-[#00f5ff]/10 border border-[#00f5ff]/30 p-4 animate-pulse">
            <p className="font-mono text-xs text-[#00f5ff]/80 tracking-wider">You will receive approximately:</p>
            <p className="font-display text-xl sm:text-2xl font-bold text-[#00f5ff] mt-1 break-all">{parseFloat(expectedCGOV).toFixed(4)} cGOV</p>
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={isMinting || !ethAmount || !address}
          className="w-full py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-mono font-bold text-xs tracking-[0.3em] hover:bg-[#00f5ff]/20 hover:border-[#00f5ff] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase relative overflow-hidden group/btn"
        >
          <div className="absolute inset-0 bg-[#00f5ff]/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10">{isMinting ? "Minting..." : "Mint cGOV Tokens"}</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-[#00f5ff]/10 border border-[#00f5ff]/40 p-4 animate-pulse">
          <p className="font-mono text-sm font-medium text-[#00f5ff] mb-2">Minting Successful!</p>
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

export default CGOVToken;
