import React from 'react';
import Link from 'next/link';
import ScrambleText from './ScrambleText';
import CyberBackground from './CyberBackground';
import GlitchText from './GlitchText';
import HexGrid from './HexGrid';
import ConsensusStatus from './ConsensusStatus';
import SecurityGateStatus from './SecurityGateStatus';
import SessionInfo from './SessionInfo';
import TEEProcessor from './TEEProcessor';
import AttestationMonitor from './AttestationMonitor';
import { ShieldCheck, ChevronRight, Lock } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative mt-10 min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505] pt-20">
      
      {/* ================= BACKGROUND LAYERS ================= */}
      <div className="absolute inset-0 z-0">
        <CyberBackground />
        <HexGrid />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)]"></div>
      </div>
      
      {/* ================= HUD GRID OVERLAY ================= */}
      {/* This layer provides the proper alignment structure for all HUD components */}
      <div className="absolute inset-0 z-20 pointer-events-none px-8 py-12 max-w-[1920px] mx-auto h-full flex justify-between">
          
          {/* LEFT FLANK COLUMN - Asymmetric positioning */}
          <div className="hidden lg:flex flex-col justify-between h-full">
              {/* Top Left - Security Gates (higher up) */}
              <div className="pt-6 hidden 2xl:block pointer-events-auto">
                 <SecurityGateStatus />
              </div>

              {/* Middle Left - Data Stream (offset down more) */}
              <div className="mt-32 hidden xl:block pointer-events-auto">
                  {/* <EncryptedDataStream /> */}
              </div>

              {/* Bottom Left - Session Info (not at very bottom) */}
              <div className="pb-24 pointer-events-auto">
                  <SessionInfo />
              </div>
          </div>

          {/* RIGHT FLANK COLUMN - Asymmetric positioning */}
          <div className="hidden lg:flex flex-col justify-between h-full items-end">
              {/* Top Right - TEE Processor (much higher) */}
              <div className="pt-20 hidden 2xl:block pointer-events-auto">
                  <TEEProcessor />
              </div>

              {/* Middle Right - Attestation Monitor (offset differently) */}
              <div className="mb-12 pointer-events-auto">
                  <AttestationMonitor />
              </div>

              {/* Bottom Right - Consensus Status (lower than left) */}
              <div className="pb-12 pointer-events-auto">
                  <ConsensusStatus />
              </div>
          </div>
      </div>


      {/* ================= MAIN HERO CONTENT ================= */}
      <div className="relative z-30 max-w-7xl px-8 text-center py-32">
        <div className="mb-10 flex justify-center items-center gap-4 animate-pulse">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#00f5ff]"></div>
          <div className="flex items-center gap-2 border border-[#00f5ff]/30 px-3 py-1 bg-[#00f5ff]/5 backdrop-blur-sm rounded-sm">
             <ShieldCheck className="w-3 h-3 text-[#00f5ff]" />
             <span className="font-mono text-[#00f5ff] text-[9px] tracking-[0.2em] uppercase text-shadow-glow">TEE Powered Governance</span>
          </div>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#00f5ff]"></div>
        </div>
        
        <h1 className="font-display text-6xl md:text-9xl font-black mb-8 leading-none tracking-tighter text-white uppercase drop-shadow-[0_0_35px_rgba(0,245,255,0.2)]">
          <GlitchText text="AZOTH" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e0f2fe] via-white to-[#00f5ff]">DAO</span>
        </h1>
        
        <div className="h-8 mb-10">
            <ScrambleText text="CONFIDENTIAL_DAO_SYSTEM_V1.0" className="font-mono text-[#00f5ff] tracking-[0.5em] text-sm md:text-base" hoverTrigger={false} />
        </div>
        
        <div className="max-w-2xl mx-auto mb-16 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00f5ff]/20 to-[#e0f2fe]/20 blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <p className="relative font-mono text-xs md:text-sm text-[#e0f2fe]/80 leading-loose uppercase tracking-widest border border-white/5 bg-black/50 p-6 backdrop-blur-sm text-center">
            <span className="text-[#00f5ff] mr-2">
                 <Lock className="inline w-3 h-3 mb-1" /> {`>>`}
            </span> 
            The first privacy-first DAO. Decoupling economic stake from governance power using Soulbound tokens and Encryption.
             <span className="text-[#00f5ff] animate-pulse">_</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          <Link href="/dao">
            <button className="relative px-12 py-5 font-mono font-bold text-xs tracking-[0.3em] transition-all group overflow-hidden bg-[#00f5ff]/5 border border-[#00f5ff]/50 hover:border-[#00f5ff] hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] text-[#00f5ff]">
               <div className="absolute inset-0 bg-[#00f5ff]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
               <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f5ff]"></div>
               <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f5ff]"></div>
              <span className="relative z-10 group-hover:text-white transition-colors flex items-center gap-2">
                  INITIATE_DAO <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
          
          <button className="px-12 py-5 bg-transparent border border-[#e0f2fe]/20 text-[#e0f2fe] font-mono font-bold text-xs tracking-[0.3em] hover:bg-[#e0f2fe]/5 hover:border-[#e0f2fe]/50 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(224,242,254,0.2)]">
            VIEW_DOCS
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-[#00f5ff] to-transparent"></div>
        <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest animate-pulse">Scroll_To_Decipher</span>
      </div>
    </section>
  );
};

export default HeroSection;