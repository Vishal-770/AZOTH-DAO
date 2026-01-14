import React from 'react';
import { RefreshCcw } from 'lucide-react';
import ScrambleText from './ScrambleText';
import CipherRings from './CipherRings';
import TerminalLog from './TerminalLog';

const CoreSection: React.FC = () => {
  return (
    <section id="architecture" className="py-32 px-8 relative w-full overflow-hidden">
      {/* Unique BG for Core: Dark Grid + Gradient */}
      <div className="absolute inset-0 bg-[#020202]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#00f5ff]/5 to-transparent"></div>
          
          {/* Animated Cipher Rings Background */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
             <CipherRings />
          </div>
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="relative group">
            <div className="absolute -inset-10 bg-[#00f5ff]/5 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
            <div className="relative glass-panel p-2">
              <div className="border border-[#e0f2fe]/10 p-4 relative overflow-hidden">
                <img 
                  alt="Protocol Architecture" 
                  className="w-full h-auto opacity-70 group-hover:opacity-100 transition-all duration-1000 grayscale contrast-125 mix-blend-lighten" 
                  src="https://www.bing.com/images/search?view=detailV2&ccid=nvkl7lJx&id=9A8BE01B033C0E62906D2366954B64A4CFA18095&thid=OIP.nvkl7lJxbx2f_D2PYNZ4yQHaEL&mediaurl=https%3a%2f%2fthumbs.dreamstime.com%2fb%2fcyber-lock-pattern-neon-holograms-deep-blue-field-encrypted-digital-world-secure-data-technology-security-futuristic-design-346561986.jpg%3fw%3d992&exph=560&expw=992&q=blue+neon+encrypted+image&FORM=IRPRST&ck=254F74C2FEE9D984105DC9F0469E44CD&selectedIndex=11&itb=0" 
                />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI0NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50"></div>
              </div>
              <div className="absolute top-4 right-6 p-2 font-mono text-[9px] text-[#00f5ff] tracking-widest border border-[#00f5ff]/20 bg-black/50 backdrop-blur">
                ARCH_RENDER_01
              </div>
              
              {/* Terminal Log Overlay */}
              <div className="absolute bottom-4 left-4 right-4 p-4 border-t border-[#00f5ff]/10 bg-black/80 backdrop-blur-md">
                 <TerminalLog />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 glass-panel flex flex-col justify-center items-center z-10">
              <RefreshCcw className="w-8 h-8 text-[#e0f2fe] animate-spin-slow mb-2" />
              <span className="font-mono text-[7px] text-center tracking-widest text-[#00f5ff]">SYNCING</span>
            </div>
          </div>
          
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#00f5ff] shadow-[0_0_5px_rgba(0,245,255,0.5)]"></span>
              <span className="font-mono text-[#00f5ff] text-xs tracking-widest uppercase">System_Overview</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-12 tracking-tighter leading-tight">
              PROTOCOL<br />
              <span className="text-[#e0f2fe]"><ScrambleText text="ARCHITECTURE" hoverTrigger={true} /></span>
            </h2>
            
            <div className="space-y-10">
              {[
                {
                    id: "01",
                    title: "DUAL_TOKEN_SYSTEM",
                    desc: "Separating money from power. cUSDC provides economic stake and vault shares, while soulbound cGOV grants voting rights—preventing whale dominance."
                },
                {
                    id: "02",
                    title: "CONFIDENTIAL_COMPUTE",
                    desc: "Built on Inco Network's TEE layer. Voting weights, ballots, and results remain encrypted until the final reveal. No bandwagon effects. No coercion."
                },
                {
                    id: "03",
                    title: "PRIVATE_AI_AGENTS",
                    desc: "Governance assistants powered by Nillion's nilAI. TEE-based inference ensures your queries and strategies remain private from the DAO and the world."
                }
              ].map((item) => (
                <div key={item.id} className="cursor-pointer group pl-4 border-l border-white/5 hover:border-[#00f5ff] transition-colors">
                  <div className="flex items-start gap-6">
                    <span className="font-mono text-[#e0f2fe] text-sm font-bold mt-1">{item.id}</span>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-[#00f5ff] transition-colors">{item.title}</h3>
                      <div className="filter blur-[4px] group-hover:blur-none opacity-40 group-hover:opacity-100 transition-all duration-500">
                        <p className="font-mono text-xs leading-relaxed text-zinc-400 max-w-lg">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreSection;