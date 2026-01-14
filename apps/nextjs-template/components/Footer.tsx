import React from 'react';
import { Grid, Terminal, Database, LayoutGrid, Fingerprint } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-32 border-t border-[#e0f2fe]/10 relative overflow-hidden w-full">
      {/* Unique BG for Footer: Pure Void with scanline */}
      <div className="absolute inset-0 bg-black">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,1)_50%,rgba(0,0,0,1)_50%)] bg-[size:100%_4px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-24">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-4 mb-10">
            <img src="/dao-logo.png" alt="Azoth DAO" className="w-8 h-8 object-contain" />
            <span className="font-display font-black text-3xl text-white tracking-[0.2em] uppercase text-shadow-silver">AZOTH_DAO</span>
          </div>
          <p className="font-mono text-xs text-zinc-500 max-w-md leading-loose uppercase tracking-widest">
            The final iteration of cryptographic independence. We are the architects of the silent void. The vault is open only to those who speak the language of the code.
          </p>
          <div className="flex gap-8 mt-12">
            <a className="text-zinc-600 hover:text-[#00f5ff] transition-colors" href="#"><Terminal className="w-5 h-5"/></a>
            <a className="text-zinc-600 hover:text-[#e0f2fe] transition-colors" href="#"><Database className="w-5 h-5"/></a>
            <a className="text-zinc-600 hover:text-[#00f5ff] transition-colors" href="#"><LayoutGrid className="w-5 h-5"/></a>
          </div>
        </div>
        
        <div>
          <h4 className="font-mono text-[10px] text-[#00f5ff] tracking-[0.5em] uppercase mb-10">Interface_Links</h4>
          <ul className="space-y-4 font-mono text-[11px] text-zinc-500">
            {['OS_DOCUMENTATION', 'ENCRYPTION_STANDARDS', 'SIGIL_MARKET', 'CORE_GOVERNANCE'].map((link) => (
               <li key={link}><a className="hover:text-white transition-colors flex items-center gap-2" href="#"><span className="w-1 h-1 bg-[#00f5ff]"></span>{link}</a></li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-mono text-[10px] text-[#e0f2fe] tracking-[0.5em] uppercase mb-10">System_Status</h4>
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-600">UPTIME</span>
              <span className="text-white">∞</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-600">NODES</span>
              <span className="text-white">DECENTRALIZED</span>
            </div>
            <div className="h-[1px] w-full bg-white/10 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-[#00f5ff] to-[#e0f2fe] animate-pulse"></div>
            </div>
          </div>
          <p className="mt-12 font-mono text-[8px] text-zinc-700 tracking-widest uppercase">
            © Alien Monolith Systems. All traces of this session will be purged.
          </p>
        </div>
      </div>
      
      <div className="absolute -bottom-24 -right-24 opacity-[0.02] pointer-events-none mix-blend-screen">
        <Fingerprint className="w-[600px] h-[600px] text-[#00f5ff]" />
      </div>
    </footer>
  );
};

export default Footer;