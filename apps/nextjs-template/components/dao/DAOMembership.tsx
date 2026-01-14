"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  AZOTH_DAO_ADDRESS,
  AZOTH_DAO_ABI,
  CONFIDENTIAL_VAULT_ADDRESS,
  CONFIDENTIAL_VAULT_ABI,
  CGOV_TOKEN_ADDRESS,
  CGOV_TOKEN_ABI,
} from "@/utils/constants";

const DAOMembership = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isMember, setIsMember] = useState(false);
  const [hasVaultShares, setHasVaultShares] = useState(false);
  const [hasVotingPower, setHasVotingPower] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembershipData = async () => {
      if (!publicClient || !address) return;
      
      setIsLoading(true);
      console.log("[DAOMembership] Fetching data for:", address);
      
      try {
        const memberStatus = await publicClient.readContract({
          address: AZOTH_DAO_ADDRESS,
          abi: AZOTH_DAO_ABI,
          functionName: "isMember",
          args: [address],
        }) as boolean;
        console.log("[DAOMembership] isMember:", memberStatus);
        setIsMember(memberStatus);

        const sharesStatus = await publicClient.readContract({
          address: CONFIDENTIAL_VAULT_ADDRESS,
          abi: CONFIDENTIAL_VAULT_ABI,
          functionName: "hasShares",
          args: [address],
        }) as boolean;
        console.log("[DAOMembership] hasVaultShares:", sharesStatus);
        setHasVaultShares(sharesStatus);

        const votingStatus = await publicClient.readContract({
          address: CGOV_TOKEN_ADDRESS,
          abi: CGOV_TOKEN_ABI,
          functionName: "hasVotingPower",
          args: [address],
        }) as boolean;
        console.log("[DAOMembership] hasVotingPower:", votingStatus);
        setHasVotingPower(votingStatus);

        const count = await publicClient.readContract({
          address: AZOTH_DAO_ADDRESS,
          abi: AZOTH_DAO_ABI,
          functionName: "memberCount",
        }) as bigint;
        console.log("[DAOMembership] memberCount:", count.toString());
        setMemberCount(Number(count));
      } catch (err) {
        console.error("[DAOMembership] Failed to fetch membership data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembershipData();
  }, [publicClient, address, txHash]);

  const handleJoinDAO = async () => {
    if (!walletClient || !address) return;
    
    setIsJoining(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "joinDAO",
      });
      
      setTxHash(hash);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        setIsMember(true);
      }
    } catch (err: unknown) {
      console.error("Join failed:", err);
      setError(err instanceof Error ? err.message : "Failed to join DAO");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveDAO = async () => {
    if (!walletClient || !address) return;
    
    setIsLeaving(true);
    setError(null);
    setTxHash(null);
    
    try {
      const hash = await walletClient.writeContract({
        address: AZOTH_DAO_ADDRESS,
        abi: AZOTH_DAO_ABI,
        functionName: "leaveDAO",
      });
      
      setTxHash(hash);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        setIsMember(false);
      }
    } catch (err: unknown) {
      console.error("Leave failed:", err);
      setError(err instanceof Error ? err.message : "Failed to leave DAO");
    } finally {
      setIsLeaving(false);
    }
  };

  const StatusIcon = ({ active }: { active: boolean }) => (
    active ? (
      <svg className="w-7 h-7 text-[#00f5ff]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-7 h-7 text-[#e0f2fe]/20" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  );

  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 lg:px-24 pb-12">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="border-b-2 border-[#00f5ff]/30 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-2">
                DAO Membership
              </h1>
              <p className="font-mono text-sm text-[#e0f2fe]/60 tracking-wider">Join or leave the Azoth DAO</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-[#e0f2fe]/50 tracking-widest uppercase">Total Members</p>
              <p className="font-display text-5xl font-black text-[#00f5ff] mt-2">{memberCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-8">

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className={`p-6 border-l-4 bg-gradient-to-br from-[#00f5ff]/5 to-transparent transition-all ${
          isMember ? "border-[#00f5ff] bg-[#00f5ff]/5" : "border-[#e0f2fe]/10"
        }`}>
          <div className="flex justify-center mb-3"><StatusIcon active={isMember} /></div>
          <p className="font-mono text-xs font-medium text-white uppercase tracking-wider text-center">DAO Member</p>
        </div>
        <div className={`p-6 border-l-4 bg-gradient-to-br from-[#00f5ff]/5 to-transparent transition-all ${
          hasVaultShares ? "border-[#00f5ff] bg-[#00f5ff]/5" : "border-[#e0f2fe]/10"
        }`}>
          <div className="flex justify-center mb-3"><StatusIcon active={hasVaultShares} /></div>
          <p className="font-mono text-xs font-medium text-white uppercase tracking-wider text-center">Vault Shares</p>
        </div>
        <div className={`p-6 border-l-4 bg-gradient-to-br from-[#00f5ff]/5 to-transparent transition-all ${
          hasVotingPower ? "border-[#00f5ff] bg-[#00f5ff]/5" : "border-[#e0f2fe]/10"
        }`}>
          <div className="flex justify-center mb-3"><StatusIcon active={hasVotingPower} /></div>
          <p className="font-mono text-xs font-medium text-white uppercase tracking-wider text-center">Voting Power</p>
        </div>
      </div>

      {/* Requirements Info */}
      {!isMember && !hasVaultShares && (
        <div className="bg-gradient-to-br from-[#00f5ff]/5 to-transparent border-l-4 border-[#00f5ff] p-6">
          <p className="font-mono text-sm text-[#00f5ff] leading-relaxed">
            <span className="text-white font-bold">{'>>'} Requirements to Join:</span> You must have vault shares 
            (deposit cUSDC into the vault) before you can join the DAO.
          </p>
        </div>
      )}

      {isMember && !hasVotingPower && (
        <div className="bg-gradient-to-br from-[#e0f2fe]/5 to-transparent border-l-4 border-[#e0f2fe] p-6">
          <p className="font-mono text-sm text-[#e0f2fe] leading-relaxed">
            <span className="text-white font-bold">{'>>'} Get Voting Power:</span> Mint cGOV tokens to be able to 
            vote on proposals. Membership alone doesn&apos;t grant voting rights.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {isLoading ? (
        <div className="text-center py-6 font-mono text-[#e0f2fe]/50 text-xs tracking-widest uppercase">Loading...</div>
      ) : isMember ? (
        <button
          onClick={handleLeaveDAO}
          disabled={isLeaving}
          className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold text-xs tracking-[0.3em] hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase"
        >
          {isLeaving ? "Leaving..." : "Leave DAO"}
        </button>
      ) : (
        <button
          onClick={handleJoinDAO}
          disabled={isJoining || !hasVaultShares}
          className="w-full py-4 bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] font-mono font-bold text-xs tracking-[0.3em] hover:bg-[#00f5ff]/20 hover:border-[#00f5ff] hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase relative overflow-hidden group/btn"
        >
          <div className="absolute inset-0 bg-[#00f5ff]/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
          <span className="relative z-10">{isJoining ? "Joining..." : "Join DAO"}</span>
        </button>
      )}

      {/* Workflow Guide */}
      <div className="bg-gradient-to-br from-[#00f5ff]/5 to-transparent border-l-4 border-[#00f5ff] p-8">
        <p className="font-mono text-base font-bold text-white mb-6 tracking-widest uppercase">Complete Workflow:</p>
        <ol className="font-mono text-sm text-[#e0f2fe]/70 space-y-4">
          <li className={`flex items-center space-x-4 ${hasVaultShares ? "text-[#00f5ff]" : ""}`}>
            <span className="w-8 h-8 bg-black/40 border border-[#e0f2fe]/30 flex items-center justify-center text-sm font-bold">1</span>
            <span>Purchase cUSDC with ETH {hasVaultShares && <span className="text-[#00f5ff]">✓</span>}</span>
          </li>
          <li className={`flex items-center space-x-4 ${hasVaultShares ? "text-[#00f5ff]" : ""}`}>
            <span className="w-8 h-8 bg-black/40 border border-[#e0f2fe]/30 flex items-center justify-center text-sm font-bold">2</span>
            <span>Deposit cUSDC into Vault {hasVaultShares && <span className="text-[#00f5ff]">✓</span>}</span>
          </li>
          <li className={`flex items-center space-x-4 ${isMember ? "text-[#00f5ff]" : ""}`}>
            <span className="w-8 h-8 bg-black/40 border border-[#e0f2fe]/30 flex items-center justify-center text-sm font-bold">3</span>
            <span>Join DAO {isMember && <span className="text-[#00f5ff]">✓</span>}</span>
          </li>
          <li className={`flex items-center space-x-4 ${hasVotingPower ? "text-[#00f5ff]" : ""}`}>
            <span className="w-8 h-8 bg-black/40 border border-[#e0f2fe]/30 flex items-center justify-center text-sm font-bold">4</span>
            <span>Mint cGOV for voting power {hasVotingPower && <span className="text-[#00f5ff]">✓</span>}</span>
          </li>
          <li className="flex items-center space-x-4">
            <span className="w-8 h-8 bg-black/40 border border-[#e0f2fe]/30 flex items-center justify-center text-sm font-bold">5</span>
            <span>Create & vote on proposals</span>
          </li>
        </ol>
      </div>

      {/* Success/Error Messages */}
      {txHash && (
        <div className="bg-gradient-to-br from-[#00f5ff]/5 to-transparent border-l-4 border-[#00f5ff] p-6 animate-pulse">
          <p className="font-mono text-base font-medium text-[#00f5ff] mb-2">Transaction Successful!</p>
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

export default DAOMembership;
