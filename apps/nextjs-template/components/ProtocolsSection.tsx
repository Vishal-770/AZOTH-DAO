import React from 'react';
import { Fingerprint, Network, Shield, ScanLine } from 'lucide-react';
import ScrambleText from './ScrambleText';

const ProtocolsSection: React.FC = () => {
  return (
    <section id="tech-stack" className="py-32 relative w-full overflow-hidden">
        {/* Background Grid */}
       <div className="absolute inset-0 bg-[#0a0a0a]">
          <div className="absolute inset-0 opacity-10" 
            style={{
                backgroundImage: 'linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]"></div>
       </div>

      <div className="max-w-[1600px] mx-auto px-8 relative z-10">
        <div className="flex justify-between items-end mb-20 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
                 <ScanLine className="w-4 h-4 text-[#00f5ff] animate-pulse" />
                 <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest uppercase">Scanning Dependencies...</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                <ScrambleText text="TECH_STACK" hoverTrigger={true} />
            </h2>
          </div>
          <div className="hidden md:block text-right">
            <span className="font-mono text-4xl text-white/5 uppercase font-bold tracking-tighter">Powered_By</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel p-10 group relative overflow-hidden transition-all duration-500 hover:border-[#00f5ff]/50 hover:bg-black/80">
            {/* Scanning Beam */}
            <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-transparent via-[#00f5ff]/10 to-transparent -translate-y-full group-hover:animate-scan-beam pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00f5ff]/50 shadow-[0_0_15px_rgba(0,245,255,0.8)] -translate-y-full group-hover:animate-scan-beam pointer-events-none z-0"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                <span className="font-mono text-[#00f5ff] text-[10px] border border-[#00f5ff]/20 px-2 py-1 bg-black">LAYER_1</span>
                <Shield className="text-[#00f5ff] w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-6 group-hover:text-[#00f5ff] transition-colors group-hover:translate-x-2 duration-300">INCO_NETWORK</h3>
                <div className="cursor-pointer">
                <p className="font-mono text-[11px] text-zinc-400 leading-relaxed group-hover:text-white transition-colors duration-300">
                    <span className="opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                        Modular blockchain bringing Trusted Execution Environment (TEE) to smart contracts. Enables confidential voting and hidden token balances.
                    </span>
                </p>
                </div>
                {/* Decryption Progress Bar */}
                <div className="mt-10 relative h-[1px] w-full bg-white/10 overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#00f5ff] w-0 group-hover:w-full transition-all duration-[2000ms] ease-out"></div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <span className="text-[8px] text-zinc-600 font-mono">STATUS: ACTIVE</span>
                    <span className="text-[8px] text-[#00f5ff] opacity-0 group-hover:opacity-100 font-mono tracking-widest transition-opacity delay-[2000ms] animate-pulse">TEE_ENABLED</span>
                </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-10 group relative overflow-hidden transition-all duration-500 hover:border-[#e0f2fe]/50 hover:bg-black/80">
            {/* Scanning Beam (Silver) */}
            <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-transparent via-[#e0f2fe]/10 to-transparent -translate-y-full group-hover:animate-scan-beam pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#e0f2fe]/50 shadow-[0_0_15px_rgba(224,242,254,0.8)] -translate-y-full group-hover:animate-scan-beam pointer-events-none z-0"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                <span className="font-mono text-[#e0f2fe] text-[10px] border border-[#e0f2fe]/20 px-2 py-1 bg-black">COMPUTE</span>
                <Network className="text-[#e0f2fe] w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-6 group-hover:text-[#e0f2fe] transition-colors group-hover:translate-x-2 duration-300">NILLION</h3>
                <div className="cursor-pointer">
                <p className="font-mono text-[11px] text-zinc-400 leading-relaxed group-hover:text-white transition-colors duration-300">
                     <span className="opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                        Blind computation network powering nilDB and nilAI. Securely stores agent chat history and runs LLM inference in Trusted Execution Environments.
                     </span>
                </p>
                </div>
                 {/* Decryption Progress Bar */}
                <div className="mt-10 relative h-[1px] w-full bg-white/10 overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#e0f2fe] w-0 group-hover:w-full transition-all duration-[2000ms] ease-out"></div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <span className="text-[8px] text-zinc-600 font-mono">STATUS: CONNECTED</span>
                    <span className="text-[8px] text-[#e0f2fe] opacity-0 group-hover:opacity-100 font-mono tracking-widest transition-opacity delay-[2000ms] animate-pulse">NILAI_READY</span>
                </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-10 group relative overflow-hidden transition-all duration-500 hover:border-[#00f5ff]/50 hover:bg-black/80">
             {/* Scanning Beam */}
            <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-transparent via-[#00f5ff]/10 to-transparent -translate-y-full group-hover:animate-scan-beam pointer-events-none z-0"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00f5ff]/50 shadow-[0_0_15px_rgba(0,245,255,0.8)] -translate-y-full group-hover:animate-scan-beam pointer-events-none z-0"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                <span className="font-mono text-[#00f5ff] text-[10px] border border-[#00f5ff]/20 px-2 py-1 bg-black">PAYMENTS</span>
                <Fingerprint className="text-[#00f5ff] w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-6 group-hover:text-[#00f5ff] transition-colors group-hover:translate-x-2 duration-300">X402_PROTOCOL</h3>
                <div className="cursor-pointer">
                <p className="font-mono text-[11px] text-zinc-400 leading-relaxed group-hover:text-white transition-colors duration-300">
                     <span className="opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                        Micropayment infrastructure for AI agents. Enables pay-per-query access ($0.01) for governance assistance without massive gas fees.
                     </span>
                </p>
                </div>
                 {/* Decryption Progress Bar */}
                <div className="mt-10 relative h-[1px] w-full bg-white/10 overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#00f5ff] w-0 group-hover:w-full transition-all duration-[2000ms] ease-out"></div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <span className="text-[8px] text-zinc-600 font-mono">STATUS: OPTIMIZED</span>
                    <span className="text-[8px] text-[#00f5ff] opacity-0 group-hover:opacity-100 font-mono tracking-widest transition-opacity delay-[2000ms] animate-pulse">LOW_LATENCY</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProtocolsSection;