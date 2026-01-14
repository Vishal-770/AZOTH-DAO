"use client";
import React from 'react';
import SecureEnclaveChip from './SecureEnclaveChip';
import { ShieldCheck, EyeOff, Lock, Zap } from 'lucide-react';
import ScrambleText from './ScrambleText';

const TEESection: React.FC = () => {
  return (
    <section className="relative py-32 w-full overflow-hidden bg-[#020202] border-y border-[#00f5ff]/10">
      
      {/* Background Circuitry */}
      <div className="absolute inset-0 z-0">
         {/* Grid Pattern */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
         
         {/* Animated Data Lines */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
                <linearGradient id="trace-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#00f5ff" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            
            {/* Horizontal Traces */}
            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="rgba(0,245,255,0.05)" strokeWidth="1" />
            <line x1="0" y1="80%" x2="100%" y2="80%" stroke="rgba(0,245,255,0.05)" strokeWidth="1" />
            
            {/* Animated Packets */}
            <circle r="2" fill="#00f5ff">
                <animateMotion dur="10s" repeatCount="indefinite" path="M0,200 L2000,200" />
            </circle>
            <circle r="2" fill="#e0f2fe">
                <animateMotion dur="15s" repeatCount="indefinite" path="M2000,600 L0,600" />
            </circle>
         </svg>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col md:flex-row items-center gap-20">
        
        {/* Left Content */}
        <div className="md:w-1/2">
            <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-[#00f5ff]" />
                <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em] uppercase">Trusted_Execution_Env</span>
            </div>
            
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
                THE BLACK BOX <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e0f2fe] to-[#00f5ff]">OF COMPUTATION</span>
            </h2>
            
            <p className="font-mono text-xs md:text-sm text-zinc-400 leading-loose mb-10 border-l-2 border-[#00f5ff]/20 pl-6">
                Sensitive governance logic runs inside hardware-isolated enclaves. Even the node operator cannot see the data being processed.
                <br /><br />
                <span className="text-[#e0f2fe]">
                   {">"} Hardware Root of Trust<br />
                   {">"} Remote Attestation<br />
                   {">"} Memory Encryption
                </span>
            </p>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-4 flex items-center gap-4 hover:border-[#00f5ff]/50 transition-colors group">
                    <div className="p-3 bg-black border border-white/10 rounded-sm group-hover:border-[#00f5ff]/30">
                        <EyeOff className="w-6 h-6 text-zinc-400 group-hover:text-[#00f5ff]" />
                    </div>
                    <div>
                        <div className="font-mono text-white font-bold text-sm">Opaque</div>
                        <div className="font-mono text-[9px] text-zinc-500 uppercase">State_Hidden</div>
                    </div>
                </div>
                 <div className="glass-panel p-4 flex items-center gap-4 hover:border-[#e0f2fe]/50 transition-colors group">
                    <div className="p-3 bg-black border border-white/10 rounded-sm group-hover:border-[#e0f2fe]/30">
                        <Lock className="w-6 h-6 text-zinc-400 group-hover:text-[#e0f2fe]" />
                    </div>
                    <div>
                        <div className="font-mono text-white font-bold text-sm">Verifiable</div>
                        <div className="font-mono text-[9px] text-zinc-500 uppercase">Cryptographic_Proof</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Visualization - The Chip on a Motherboard */}
        <div className="md:w-1/2 flex justify-center relative">
            
            {/* Central Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00f5ff]/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="relative group">
                {/* Connecting Traces entering the chip */}
                <div className="absolute top-1/2 -left-24 w-24 h-[2px] bg-gradient-to-r from-transparent to-[#00f5ff]/50 -translate-y-1/2 z-0"></div>
                <div className="absolute top-1/2 -right-24 w-24 h-[2px] bg-gradient-to-l from-transparent to-[#00f5ff]/50 -translate-y-1/2 z-0"></div>
                
                {/* Scale up the component we made earlier */}
                <div className="transform scale-125 transition-transform duration-700 hover:scale-[1.3]">
                    <SecureEnclaveChip />
                </div>

                {/* Floating Labels */}
                <div className="absolute -top-10 -right-10 glass-panel px-3 py-1 animate-bounce duration-[3000ms]">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-[#e0f2fe]" />
                        <span className="font-mono text-[9px] text-white">ENCLAVE_ACTIVE</span>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </section>
  );
};

export default TEESection;