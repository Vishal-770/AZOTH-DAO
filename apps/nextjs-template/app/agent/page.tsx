"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import Padder from "@/components/padder";

export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";

interface AgentInfo {
  name: string;
  description: string;
  capabilities: string[];
  pricing: {
    model: string;
    price: string;
    paymentMethod: string;
  };
  privacy: {
    inference: string;
    storage: string;
  };
  agentId: string;
}

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL || "http://localhost:3001";

export default function AgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get proposal context from URL params
  const proposalTitle = searchParams.get("title") || "";
  const proposalDescription = searchParams.get("description") || "";

  useEffect(() => {
    async function fetchAgentInfo() {
      try {
        const response = await fetch(`${AGENT_API_URL}/agent`);
        if (!response.ok) throw new Error("Failed to fetch agent info");
        const data = await response.json();
        setAgentInfo(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchAgentInfo();
  }, []);

  const handleChatWithAgent = () => {
    const params = new URLSearchParams();
    if (proposalTitle) params.set("title", proposalTitle);
    if (proposalDescription) params.set("description", proposalDescription);
    router.push(`/agent/chat?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f5ff]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-red-500/10 border border-red-500/40 p-8">
          <h2 className="font-mono text-xl font-bold text-red-400 mb-2 tracking-wider uppercase">Connection Error</h2>
          <p className="font-mono text-sm text-white mb-4">{error}</p>
          <p className="font-mono text-xs text-[#e0f2fe]/50 tracking-wider">
            Make sure the AI Agent backend is running on {AGENT_API_URL}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Background ambient lines */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0 flex justify-around">
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#00f5ff]/20 to-transparent"></div>
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#e0f2fe]/20 to-transparent"></div>
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#00f5ff]/10 to-transparent"></div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 relative z-10">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[#e0f2fe]/60 hover:text-[#00f5ff] transition-colors font-mono text-sm tracking-wider"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Proposals
          </button>

          {/* Agent Card */}
          <div className="bg-black/60 border border-[#00f5ff]/30 p-8 relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f5ff]"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f5ff]"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f5ff]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f5ff]"></div>
            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00f5ff] to-[#e0f2fe] flex items-center justify-center border border-[#00f5ff]/50 shadow-[0_0_30px_rgba(0,245,255,0.4)] p-3">
                <img src="/dao-logo.png" alt="Azoth DAO" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1">
                <h1 className="font-display text-3xl font-bold text-white mb-2 tracking-wider">Azoth DAO AI Advisor</h1>
                <p className="font-mono text-sm text-[#e0f2fe]/70 leading-relaxed">
                  A privacy-preserving DAO proposal AI advisor powered by Nillion. Uses nilAI for secure LLM inference in TEE, nilDB for encrypted data storage, and x402 for pay-per-query payments. All governance conversations are encrypted and processed securely.
                </p>
              </div>
            </div>

            {/* Technology Stack Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-3 py-1.5 bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 font-mono text-[10px] tracking-widest flex items-center gap-1.5 uppercase font-bold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                nilAI TEE
              </span>
              <span className="px-3 py-1.5 bg-[#e0f2fe]/10 text-[#e0f2fe] border border-[#e0f2fe]/30 font-mono text-[10px] tracking-widest flex items-center gap-1.5 uppercase font-bold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                nilDB Encrypted
              </span>
              <span className="px-3 py-1.5 bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30 font-mono text-[10px] tracking-widest flex items-center gap-1.5 uppercase font-bold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                x402 Payments
              </span>
              <span className="px-3 py-1.5 bg-[#e0f2fe]/10 text-[#e0f2fe] border border-[#e0f2fe]/30 font-mono text-[10px] tracking-widest flex items-center gap-1.5 uppercase font-bold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                ERC-8004
              </span>
            </div>

            {/* Capabilities */}
            <div className="mb-8">
              <h2 className="font-mono text-[10px] font-bold text-[#e0f2fe] mb-4 flex items-center gap-2 tracking-widest uppercase">
                <svg className="w-5 h-5 text-[#00f5ff]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Capabilities
              </h2>
              <div className="flex flex-wrap gap-2">
                {agentInfo?.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-3 py-1.5 bg-black/40 text-[#e0f2fe] border border-[#e0f2fe]/30 font-mono text-xs"
                  >
                    {cap.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </span>
                ))}
              </div>
            </div>

            {/* Privacy & Pricing Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Privacy */}
              <div className="bg-black/40 border border-[#e0f2fe]/20 p-6">
                <h3 className="font-mono text-[10px] font-bold text-[#e0f2fe] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00f5ff]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Privacy
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Inference</p>
                    <p className="font-mono text-sm text-white">{agentInfo?.privacy.inference}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Storage</p>
                    <p className="font-mono text-sm text-white">{agentInfo?.privacy.storage}</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-black/40 border border-[#e0f2fe]/20 p-6">
                <h3 className="font-mono text-[10px] font-bold text-[#e0f2fe] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00f5ff]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Pricing
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Model</p>
                    <p className="font-mono text-sm text-white capitalize">{agentInfo?.pricing.model.replace("-", " ")}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Price per Query</p>
                    <p className="text-2xl font-bold text-[#00f5ff]">{agentInfo?.pricing.price}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Payment</p>
                    <p className="font-mono text-sm text-white uppercase">{agentInfo?.pricing.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal Context (if passed) */}
            {(proposalTitle || proposalDescription) && (
              <div className="mb-8 bg-[#e0f2fe]/5 border border-[#e0f2fe]/30 p-6 relative">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#e0f2fe]"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#e0f2fe]"></div>
                <h3 className="font-mono text-[10px] font-bold text-[#e0f2fe] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Proposal Context
                </h3>
                {proposalTitle && (
                  <p className="text-white font-mono text-sm font-medium mb-2">{proposalTitle}</p>
                )}
                {proposalDescription && (
                  <p className="text-[#e0f2fe]/70 font-mono text-xs">{proposalDescription.substring(0, 200)}...</p>
                )}
              </div>
            )}

            {/* Agent ID */}
            <div className="flex items-center justify-between font-mono text-xs text-[#e0f2fe]/50 mb-8 px-2 tracking-wider">
              <span>Agent ID: {agentInfo?.agentId || "Not registered"}</span>
              <span>ERC-8004 Verified</span>
            </div>

            {/* ERC-8004 Registration Details */}
            <div className="mb-8 bg-black/40 border border-[#e0f2fe]/20 p-6">
              <h3 className="font-mono text-[10px] font-bold text-[#e0f2fe] uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#00f5ff]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                ERC-8004 Registration
              </h3>
              <div className="space-y-4">
                {/* Agent ID with 8004scan link */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Agent ID</p>
                    <p className="text-xl font-bold text-[#00f5ff]">7473</p>
                  </div>
                  <a
                    href="https://www.8004scan.io/agents/sepolia/7473"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/30 hover:border-[#00f5ff] font-mono text-xs tracking-wider transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on 8004scan
                  </a>
                </div>

                {/* Owner DID */}
                <div>
                  <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Owner DID</p>
                  <p className="text-[#e0f2fe] font-mono text-sm break-all">8bf34e49-63a0-4970-be65-2d2c9f8b21a2</p>
                </div>

                {/* Agent URI with IPFS link */}
                <div>
                  <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">Agent URI (IPFS)</p>
                  <a
                    href="https://ipfs.io/ipfs/QmaRNabCdRiEp3eakY6nbaYaJ7PourDzt3rvF9mbLMbtdQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00f5ff] hover:text-[#e0f2fe] font-mono text-sm break-all flex items-center gap-2 transition-colors"
                  >
                    ipfs://QmaRNabCdRiEp3eakY6nbaYaJ7PourDzt3rvF9mbLMbtdQ
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* A2A Endpoint */}
                <div>
                  <p className="font-mono text-[9px] text-[#e0f2fe]/50 mb-1 tracking-wider uppercase">A2A Endpoint</p>
                  <a
                    href={`${AGENT_API_URL}/.well-known/agent-card.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00f5ff] hover:text-[#e0f2fe] font-mono text-sm break-all flex items-center gap-2 transition-colors"
                  >
                    {AGENT_API_URL}/.well-known/agent-card.json
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleChatWithAgent}
              className="w-full py-4 bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 border border-[#00f5ff]/30 hover:border-[#00f5ff] text-[#00f5ff] font-mono font-bold tracking-widest transition-all uppercase flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat with Agent
            </button>
          </div>
        </div>
      </div>
    
  );
}
