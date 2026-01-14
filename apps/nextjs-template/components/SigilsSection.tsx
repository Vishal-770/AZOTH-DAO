import React from 'react';
import Image from 'next/image';
import { Vote, FileCode, Users, Activity, Lock, ShieldAlert, GitPullRequest, Boxes } from 'lucide-react';
import ScrambleText from './ScrambleText';

const SigilsSection: React.FC = () => {
  return (
    <section id="sigils" className="py-32 px-8 relative w-full overflow-hidden min-h-screen flex flex-col justify-center">
      {/* Unique BG for Sigils: Deep Radial Silver/Blue Gradient with Grid Overlay */}
      <div className="absolute inset-0 bg-[#050505] z-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(224,242,254,0.05),transparent_60%)]"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,245,255,0.03),transparent_50%)]"></div>
         <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10 w-full">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-end mb-24 gap-12 border-b border-[#e0f2fe]/10 pb-12">
            <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4 text-[#00f5ff]/80">
                    <Vote className="w-5 h-5" />
                    <span className="font-mono text-xs tracking-[0.3em] uppercase">Decentralized_Consensus</span>
                </div>
                <h2 className="font-display text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none">
                    DAO <span className="text-[#e0f2fe] opacity-80">GOVERNANCE</span>
                </h2>
                <p className="font-mono text-xs md:text-sm text-zinc-400 leading-loose uppercase tracking-widest max-w-xl">
                    The legislative core of the Azoth DAO. Submit encrypted proposals, stake sigils for voting weight, and direct the protocol's evolution through zero-knowledge ballots.
                </p>
            </div>

            {/* Stats Block */}
            <div className="flex gap-4 md:gap-8">
                <div className="glass-panel p-6 flex flex-col items-center justify-center min-w-[140px] border-t-2 border-t-[#00f5ff]">
                     <GitPullRequest className="w-6 h-6 text-[#00f5ff] mb-3 opacity-80" />
                     <div className="font-mono text-2xl text-white font-bold mb-1">
                        <ScrambleText text="042" hoverTrigger={true} />
                     </div>
                     <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Active_Props</span>
                </div>
                <div className="glass-panel p-6 flex flex-col items-center justify-center min-w-[140px] border-t-2 border-t-[#e0f2fe]">
                     <Users className="w-6 h-6 text-[#e0f2fe] mb-3 opacity-80" />
                     <div className="font-mono text-2xl text-white font-bold mb-1">98%</div>
                     <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Quorum_Met</span>
                </div>
            </div>
        </div>
        
        {/* Encrypted Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Proposal 01 */}
            <div className="group relative">
                {/* File Header Tab */}
                <div className="flex justify-between items-center mb-2 px-2">
                    <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-[#00f5ff] rounded-full animate-pulse"></div>
                         <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest">CIP_099.json</span>
                    </div>
                    <span className="font-mono text-[9px] text-zinc-600">STATE: VOTING_OPEN</span>
                </div>

                {/* Main Image Container */}
                <div className="relative glass-panel p-2 overflow-hidden transition-all duration-500 group-hover:border-[#00f5ff]/40 group-hover:shadow-[0_0_50px_rgba(0,245,255,0.15)]">
                    {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#00f5ff]/50 z-20"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#00f5ff]/50 z-20"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#00f5ff]/50 z-20"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#00f5ff]/50 z-20"></div>

                    {/* Image Wrapper */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-black">
                         <Image 
                            alt="Protocol Upgrade Visualization" 
                            className="object-cover opacity-60 grayscale contrast-125 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                            src="/voting.png"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* Scanline Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none z-10"></div>
                        
                        {/* Locked Overlay State */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] group-hover:opacity-0 transition-opacity duration-500 z-10">
                            <Lock className="w-12 h-12 text-zinc-500 mb-4" />
                            <div className="px-4 py-1 border border-zinc-700 bg-black/80">
                                <span className="font-mono text-[10px] text-zinc-400 tracking-[0.3em]">CONNECT_TO_VOTE</span>
                            </div>
                        </div>

                         {/* Hover Details */}
                        <div className="absolute bottom-0 left-0 w-full p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                            <h3 className="text-white font-display text-2xl font-bold mb-2">SHARD_OPTIMIZATION</h3>
                            <div className="flex gap-4 font-mono text-[9px] text-[#00f5ff]">
                                <span className="flex items-center gap-1"><Boxes className="w-3 h-3"/> CORE_UPGRADE</span>
                                <span className="flex items-center gap-1"><Activity className="w-3 h-3"/> HIGH_PRIORITY</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* File Footer */}
                <div className="mt-3 flex justify-between items-center px-2">
                     <div className="h-[1px] flex-grow bg-zinc-800 mr-4 group-hover:bg-[#00f5ff]/30 transition-colors"></div>
                     <span className="font-mono text-[9px] text-zinc-600 group-hover:text-[#00f5ff] transition-colors">VOTING_POWER: 450K</span>
                </div>
            </div>

            {/* Treasury 02 */}
            <div className="group relative mt-12 md:mt-24">
                {/* File Header Tab */}
                 <div className="flex justify-between items-center mb-2 px-2">
                    <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-[#e0f2fe] rounded-full animate-pulse"></div>
                         <span className="font-mono text-[10px] text-[#e0f2fe] tracking-widest">TREASURY_ALLOC.enc</span>
                    </div>
                    <span className="font-mono text-[9px] text-zinc-600">STATE: EXECUTING</span>
                </div>

                {/* Main Image Container */}
                 <div className="relative glass-panel p-2 overflow-hidden transition-all duration-500 group-hover:border-[#e0f2fe]/40 group-hover:shadow-[0_0_50px_rgba(224,242,254,0.15)]">
                     {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#e0f2fe]/50 z-20"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#e0f2fe]/50 z-20"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#e0f2fe]/50 z-20"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#e0f2fe]/50 z-20"></div>

                    {/* Image Wrapper */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-black">
                         <Image 
                            alt="Treasury Visualization" 
                            className="object-cover opacity-60 grayscale contrast-125 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                            src="/vault.png"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                         {/* Scanline Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none z-10"></div>

                         {/* Locked Overlay State */}
                         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] group-hover:opacity-0 transition-opacity duration-500 z-10">
                            <ShieldAlert className="w-12 h-12 text-zinc-500 mb-4" />
                            <div className="px-4 py-1 border border-zinc-700 bg-black/80">
                                <span className="font-mono text-[10px] text-zinc-400 tracking-[0.3em]">RESTRICTED_ACCESS</span>
                            </div>
                        </div>

                         {/* Hover Details */}
                        <div className="absolute bottom-0 left-0 w-full p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                            <h3 className="text-white font-display text-2xl font-bold mb-2">LIQUIDITY_INJECTION</h3>
                            <div className="flex gap-4 font-mono text-[9px] text-[#e0f2fe]">
                                <span className="flex items-center gap-1"><FileCode className="w-3 h-3"/> SMART_CONTRACT</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3"/> MULTISIG_AUTH</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* File Footer */}
                <div className="mt-3 flex justify-between items-center px-2">
                     <div className="h-[1px] flex-grow bg-zinc-800 mr-4 group-hover:bg-[#e0f2fe]/30 transition-colors"></div>
                     <span className="font-mono text-[9px] text-zinc-600 group-hover:text-[#e0f2fe] transition-colors">TIMELOCK: 24H_REMAINING</span>
                </div>
            </div>

        </div>

        {/* Decorative background elements for the section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#050505] opacity-50 radial-mask pointer-events-none mix-blend-color"></div>
      </div>
    </section>
  );
};

export default SigilsSection;