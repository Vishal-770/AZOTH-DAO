"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import Padder from "@/components/padder";
import { DollarSign, Lock, Vote, Users, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
import {
  CUSDCMarketplace,
  CGOVToken,
  ConfidentialVault,
  DAOMembership,
  Proposals,
} from "@/components/dao";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import {
  CUSDC_MARKETPLACE_ADDRESS,
  CGOV_TOKEN_ADDRESS,
  CONFIDENTIAL_VAULT_ADDRESS,
  AZOTH_DAO_ADDRESS,
} from "@/utils/constants";

type Tab = "marketplace" | "vault" | "governance" | "membership" | "proposals";

const Page = () => {
  const [activeTab, setActiveTab] = useState<Tab>("marketplace");
  const [showDebug, setShowDebug] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { address } = useAccount();
  const { authenticated, ready } = usePrivy();
  
  // Use Privy's authenticated state for connection check
  const isConnected = authenticated && ready;

  useEffect(() => {
    console.log("[App] isConnected:", isConnected);
    console.log("[App] Connected address:", address);
    console.log("[App] Contract Addresses:");
    console.log("  cUSDC Marketplace:", CUSDC_MARKETPLACE_ADDRESS);
    console.log("  cGOV Token:", CGOV_TOKEN_ADDRESS);
    console.log("  Confidential Vault:", CONFIDENTIAL_VAULT_ADDRESS);
    console.log("  Azoth DAO:", AZOTH_DAO_ADDRESS);
  }, [address, isConnected]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "marketplace", label: "cUSDC Marketplace", icon: <DollarSign className="w-4 h-4" /> },
    { id: "vault", label: "Confidential Vault", icon: <Lock className="w-4 h-4" /> },
    { id: "membership", label: "DAO Membership", icon: <Users className="w-4 h-4" /> },
    { id: "governance", label: "cGOV Token", icon: <Vote className="w-4 h-4" /> },
    { id: "proposals", label: "Proposals", icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Background ambient lines */}
      <div className="fixed inset-0 pointer-events-none opacity-10 z-0 flex justify-around">
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#00f5ff]/20 to-transparent"></div>
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#e0f2fe]/20 to-transparent"></div>
        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#00f5ff]/10 to-transparent"></div>
      </div>
      <Header />
      
    {!isConnected ? (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 pt-24 pb-16">
          <div className="max-w-4xl w-full">
            {/* Hero Section */}
            <div className="relative mb-16">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-64 h-64 sm:w-96 sm:h-96 bg-[#00f5ff]/20 rounded-full blur-[120px]"></div>
              </div>
              
              {/* Logo placeholder */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-[#00f5ff] via-[#e0f2fe] to-[#00f5ff] flex items-center justify-center mx-auto mb-8 border border-[#00f5ff]/50 shadow-[0_0_40px_rgba(0,245,255,0.5)]">
                <span className="text-black font-display font-black text-4xl sm:text-6xl">A</span>
              </div>
              
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase text-center">
                Azoth <span className="text-[#00f5ff]">DAO</span>
              </h2>
              <p className="font-mono text-xs sm:text-sm text-[#e0f2fe]/80 mb-2 tracking-widest uppercase text-center">
                Confidential Governance Protocol
              </p>
              <p className="font-mono text-xs sm:text-sm text-[#e0f2fe]/50 max-w-2xl mx-auto leading-relaxed text-center px-4">
                Privacy-preserving DAO powered by fully homomorphic encryption. 
                Your votes, your balances, your privacy.
              </p>
            </div>

            {/* Privacy Features */}
            <div className="p-6 sm:p-8 md:p-10 max-w-3xl mx-auto border border-[#00f5ff]/20 hover:border-[#00f5ff]/40 transition-all group relative overflow-hidden bg-black/40 backdrop-blur-xl mb-8">
              {/* Scanning beam effect */}
              <div className="absolute top-0 left-0 w-full h-[80px] bg-gradient-to-b from-transparent via-[#00f5ff]/5 to-transparent -translate-y-full group-hover:animate-scan-beam pointer-events-none"></div>
              
              <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-8 flex items-center justify-center space-x-2 tracking-tight">
                <svg className="w-5 h-5 text-[#00f5ff] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-mono text-xs tracking-[0.2em] uppercase">Privacy Guarantees</span>
              </h3>
              <ul className="font-mono text-xs text-[#e0f2fe]/60 space-y-5 leading-relaxed">
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-[#00f5ff] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Encrypted balances for cUSDC, cGOV, and vault shares</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-[#00f5ff] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Hidden vote weights prevent whale influence visibility</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-[#00f5ff] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Confidential proposal amounts until execution</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-[#00f5ff] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Only final vote outcome is revealed publicly</span>
                </li>
              </ul>
            </div>

            {/* DAO Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12 max-w-3xl mx-auto">
              <div className="border border-[#e0f2fe]/10 bg-black/20 p-4 sm:p-6 hover:border-[#00f5ff]/30 transition-all group">
                <div className="flex items-center space-x-3 mb-3">
                  <DollarSign className="w-5 h-5 text-[#00f5ff] group-hover:scale-110 transition-transform" />
                  <h4 className="font-mono text-xs tracking-[0.15em] text-white uppercase">cUSDC Marketplace</h4>
                </div>
                <p className="font-mono text-xs text-[#e0f2fe]/50 leading-relaxed">
                  Exchange ETH for confidential USDC at 2,000:1 ratio
                </p>
              </div>

              <div className="border border-[#e0f2fe]/10 bg-black/20 p-4 sm:p-6 hover:border-[#00f5ff]/30 transition-all group">
                <div className="flex items-center space-x-3 mb-3">
                  <Lock className="w-5 h-5 text-[#00f5ff] group-hover:scale-110 transition-transform" />
                  <h4 className="font-mono text-xs tracking-[0.15em] text-white uppercase">Confidential Vault</h4>
                </div>
                <p className="font-mono text-xs text-[#e0f2fe]/50 leading-relaxed">
                  ERC-4626 vault with ragequit protection
                </p>
              </div>

              <div className="border border-[#e0f2fe]/10 bg-black/20 p-4 sm:p-6 hover:border-[#00f5ff]/30 transition-all group">
                <div className="flex items-center space-x-3 mb-3">
                  <Vote className="w-5 h-5 text-[#00f5ff] group-hover:scale-110 transition-transform" />
                  <h4 className="font-mono text-xs tracking-[0.15em] text-white uppercase">cGOV Token</h4>
                </div>
                <p className="font-mono text-xs text-[#e0f2fe]/50 leading-relaxed">
                  Non-transferable governance tokens for voting power
                </p>
              </div>

              <div className="border border-[#e0f2fe]/10 bg-black/20 p-4 sm:p-6 hover:border-[#00f5ff]/30 transition-all group">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-5 h-5 text-[#00f5ff] group-hover:scale-110 transition-transform" />
                  <h4 className="font-mono text-xs tracking-[0.15em] text-white uppercase">Proposals</h4>
                </div>
                <p className="font-mono text-xs text-[#e0f2fe]/50 leading-relaxed">
                  Create and vote on proposals with encrypted ballots
                </p>
              </div>
            </div>

            <p className="text-center text-[#e0f2fe]/40 font-mono text-xs tracking-wider uppercase">
              Connect your wallet to get started
            </p>
          </div>
          </div>
      ) : (
          <div className="min-h-screen">
            {/* Sticky Collapsible Sidebar */}
            <aside className={`fixed left-0 top-20 bottom-0 z-40 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-16 lg:w-64'} border-r border-[#00f5ff]/20 bg-[#050505]/98 backdrop-blur-xl`}>
              <div className="flex flex-col">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-3 border-b border-[#00f5ff]/10">
                  {!sidebarCollapsed && (
                    <span className="font-mono text-[9px] tracking-[0.2em] text-[#00f5ff] font-bold">MENU</span>
                  )}
                  {sidebarCollapsed && (
                    <img src="/dao-logo.png" alt="Azoth DAO" className="w-6 h-6 object-contain mx-auto" />
                  )}
                </div>

                {/* Toggle Button - Desktop Only */}
                <div className="hidden lg:block px-2 py-3 border-b border-[#00f5ff]/10">
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="w-full p-2 border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 hover:bg-[#00f5ff]/10 transition-all group"
                    title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {sidebarCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-[#00f5ff] group-hover:translate-x-0.5 transition-transform" />
                      ) : (
                        <>
                          <ChevronLeft className="w-4 h-4 text-[#00f5ff] group-hover:-translate-x-0.5 transition-transform" />
                          <span className="font-mono text-[9px] tracking-wider text-[#00f5ff]">COLLAPSE</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left group relative overflow-hidden transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-[#00f5ff]/10 border-l-4 border-[#00f5ff] shadow-[inset_0_0_20px_rgba(0,245,255,0.1)]"
                          : "border-l-4 border-transparent hover:border-[#e0f2fe]/30 hover:bg-[#e0f2fe]/5"
                      } ${sidebarCollapsed ? 'px-0 py-3' : 'px-4 py-3'}`}
                      title={sidebarCollapsed ? tab.label : undefined}
                    >
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-linear-to-r from-[#00f5ff]/0 to-[#00f5ff]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                      
                      <div className={`relative flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <span className={`shrink-0 transition-all duration-200 ${
                          activeTab === tab.id ? "text-[#00f5ff] scale-110" : "text-[#e0f2fe]/70 group-hover:text-[#e0f2fe] group-hover:scale-105"
                        }`}>{tab.icon}</span>
                        {!sidebarCollapsed && (
                          <span className={`font-mono text-[10px] tracking-[0.15em] transition-colors truncate uppercase ${
                            activeTab === tab.id ? "text-[#00f5ff] font-bold" : "text-[#e0f2fe]/70 group-hover:text-[#e0f2fe]"
                          }`}>
                            {tab.label}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </nav>

                {/* Footer Status */}
                <div className={`border-t border-[#00f5ff]/10 bg-black/40 ${sidebarCollapsed ? 'p-2' : 'p-2 lg:p-4'}`}>
                  {/* Mobile: Always show dot only */}
                  <div className="lg:hidden flex justify-center">
                    <span className="w-2 h-2 bg-[#00f5ff] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,245,255,0.8)]"></span>
                  </div>
                  
                  {/* Desktop: Show full info when expanded, dot when collapsed */}
                  <div className="hidden lg:block">
                    {!sidebarCollapsed ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#00f5ff] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,245,255,0.8)]"></span>
                          <span className="font-mono text-[8px] tracking-[0.2em] text-[#e0f2fe]/70 uppercase">Connected</span>
                        </div>
                        {isConnected && address && (
                          <div className="font-mono text-[7px] text-[#e0f2fe]/40 truncate">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <span className="w-2 h-2 bg-[#00f5ff] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,245,255,0.8)]"></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>



            {/* Main Content */}
            <main className={`transition-all duration-300 ml-16 ${!sidebarCollapsed ? 'lg:ml-64' : ''} min-h-screen`}>
              {activeTab === "marketplace" && <CUSDCMarketplace />}
              {activeTab === "vault" && <ConfidentialVault />}
              {activeTab === "governance" && <CGOVToken />}
              {activeTab === "membership" && <DAOMembership />}
              {activeTab === "proposals" && <Proposals />}

            </main>

            {/* Footer Info */}
            <footer className={`transition-all duration-300 ml-16 ${!sidebarCollapsed ? 'lg:ml-64' : ''} py-8 px-4 sm:px-6 md:px-8 bg-[#050505]/50`}>
              <div className="max-w-7xl mx-auto">
                <div className="p-4 sm:p-6 border border-[#00f5ff]/20 bg-black/40 backdrop-blur-xl">
                  <h3 className="font-mono text-xs font-semibold text-[#e0f2fe]/60 mb-4 tracking-[0.2em] uppercase">
                    Protocol Parameters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center font-mono text-sm">
                    <div>
                      <p className="text-[#e0f2fe]/40 mb-1 text-[10px] tracking-wider uppercase">Voting Period</p>
                      <p className="font-bold text-[#00f5ff] text-base whitespace-nowrap">~60 seconds</p>
                    </div>
                    <div>
                      <p className="text-[#e0f2fe]/40 mb-1 text-[10px] tracking-wider uppercase">Timelock</p>
                      <p className="font-bold text-[#00f5ff] text-base whitespace-nowrap">10 seconds</p>
                    </div>
                    <div>
                      <p className="text-[#e0f2fe]/40 mb-1 text-[10px] tracking-wider uppercase">Quorum</p>
                      <p className="font-bold text-[#00f5ff] text-base">10%</p>
                    </div>
                  </div>
                </div>
                
                {/* Debug Panel */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="font-mono text-xs text-[#e0f2fe]/30 hover:text-[#00f5ff]/60 transition-colors tracking-wider"
                  >
                    {showDebug ? "Hide Debug Info" : "Show Debug Info"}
                  </button>
                  
                  {showDebug && (
                    <div className="mt-3 p-4 font-mono text-xs border border-[#00f5ff]/10 bg-black/40 backdrop-blur-xl overflow-x-auto">
                      <p className="text-[#e0f2fe]/40 mb-2 tracking-wider">Contract Addresses (Base Sepolia):</p>
                      <p className="text-[#e0f2fe]/60 break-all">cUSDC: <span className="text-[#00f5ff]">{CUSDC_MARKETPLACE_ADDRESS}</span></p>
                      <p className="text-[#e0f2fe]/60 break-all">cGOV: <span className="text-[#00f5ff]">{CGOV_TOKEN_ADDRESS}</span></p>
                      <p className="text-[#e0f2fe]/60 break-all">Vault: <span className="text-[#00f5ff]">{CONFIDENTIAL_VAULT_ADDRESS}</span></p>
                      <p className="text-[#e0f2fe]/60 break-all">DAO: <span className="text-[#00f5ff]">{AZOTH_DAO_ADDRESS}</span></p>
                      <p className="mt-3 text-[#e0f2fe]/40 tracking-wider">Your Address:</p>
                      <p className="text-[#e0f2fe] break-all">{address}</p>
                    </div>
                  )}
                </div>
              </div>
            </footer>
          </div>
      )}
    </div>
  );
};

export default Page;
