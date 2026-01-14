import React, { useState, useEffect } from 'react';
import { Lock, Cpu, Zap, Activity, ShieldCheck, Binary } from 'lucide-react';

const SecureEnclaveChip: React.FC = () => {
  const [activeCore, setActiveCore] = useState(0);
  const [temp, setTemp] = useState(65);

  // Cycle through cores for visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCore((prev) => (prev + 1) % 4);
      setTemp(prev => 60 + Math.random() * 15);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-72 h-auto flex flex-col items-center gap-4 pointer-events-auto">
      {/* Header Label */}
      <div className="flex items-center justify-between w-full border-b border-[#00f5ff]/20 pb-2">
        <div className="flex items-center gap-2">
           <Cpu className="w-4 h-4 text-[#00f5ff]" />
           <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest uppercase">NILLION_TEE_SOC</span>
        </div>
        <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-mono text-[8px] text-zinc-500 uppercase">ONLINE</span>
        </div>
      </div>

      {/* CHIP PACKAGE VISUAL */}
      <div className="relative w-48 h-48 bg-[#0a0a0a] border border-zinc-800 rounded-xl shadow-[0_0_30px_rgba(0,245,255,0.1)] flex items-center justify-center group overflow-hidden">
         
         {/* Circuit Trace Background - Animated via CSS */}
         <div className="absolute inset-0 opacity-30">
             <svg className="w-full h-full" viewBox="0 0 100 100">
                <path d="M10 0 V30 L30 50" fill="none" stroke="#00f5ff" strokeWidth="0.5" className="animate-[pulse_2s_infinite]" />
                <path d="M90 0 V30 L70 50" fill="none" stroke="#00f5ff" strokeWidth="0.5" className="animate-[pulse_2s_infinite_0.5s]" />
                <path d="M10 100 V70 L30 50" fill="none" stroke="#00f5ff" strokeWidth="0.5" className="animate-[pulse_2s_infinite_1s]" />
                <path d="M90 100 V70 L70 50" fill="none" stroke="#00f5ff" strokeWidth="0.5" className="animate-[pulse_2s_infinite_1.5s]" />
                
                {/* Random Data Dots */}
                <circle cx="10" cy="15" r="1" fill="#e0f2fe" className="animate-[ping_3s_infinite]" />
                <circle cx="90" cy="85" r="1" fill="#e0f2fe" className="animate-[ping_4s_infinite]" />
             </svg>
         </div>

         {/* Corner Screws */}
         <div className="absolute top-2 left-2 w-2 h-2 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center"><div className="w-[1px] h-full bg-zinc-700 rotate-45"></div></div>
         <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center"><div className="w-[1px] h-full bg-zinc-700 rotate-45"></div></div>
         <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center"><div className="w-[1px] h-full bg-zinc-700 rotate-45"></div></div>
         <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center"><div className="w-[1px] h-full bg-zinc-700 rotate-45"></div></div>

         {/* THE DIE (Core) */}
         <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-900 to-black border border-[#00f5ff]/30 rounded-lg flex items-center justify-center z-10 shadow-inner">
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-[#00f5ff]/5 animate-pulse rounded-lg"></div>
            
            {/* Encryption Lock */}
            <div className="relative z-20 flex flex-col items-center">
                <Lock className="w-8 h-8 text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
                <Binary className="w-4 h-4 text-[#e0f2fe]/50 mt-1 animate-pulse" />
            </div>

            {/* Scanning Laser Effect */}
            <div className="absolute top-0 w-full h-[2px] bg-[#00f5ff]/50 shadow-[0_0_10px_#00f5ff] animate-[scan-beam_2s_linear_infinite]"></div>
         </div>

         {/* Heat Sinks / Tech Decals */}
         <div className="absolute top-1/2 left-2 w-4 h-12 -translate-y-1/2 flex flex-col gap-1">
             {[0,1,2,3].map(i => (
                 <div key={i} className={`w-full h-[2px] ${activeCore === i ? 'bg-[#00f5ff]' : 'bg-zinc-800'} transition-colors duration-300`}></div>
             ))}
         </div>
         <div className="absolute top-1/2 right-2 w-4 h-12 -translate-y-1/2 flex flex-col gap-1 items-end">
             {[0,1,2,3].map(i => (
                 <div key={i} className={`w-full h-[2px] ${activeCore === (3-i) ? 'bg-[#e0f2fe]' : 'bg-zinc-800'} transition-colors duration-300`}></div>
             ))}
         </div>
      </div>

      {/* Live Stats Panel */}
      <div className="w-full grid grid-cols-3 gap-2">
          {/* Freq */}
          <div className="glass-panel p-2 flex flex-col items-center justify-center border-t-2 border-t-[#00f5ff]">
              <Activity className="w-3 h-3 text-[#00f5ff] mb-1" />
              <span className="font-mono text-[8px] text-zinc-500">CLOCK</span>
              <span className="font-mono text-[10px] text-white font-bold">4.2<span className="text-zinc-600 text-[8px]">GHz</span></span>
          </div>
           {/* Temp */}
           <div className="glass-panel p-2 flex flex-col items-center justify-center border-t-2 border-t-red-500">
              <Zap className="w-3 h-3 text-red-500 mb-1" />
              <span className="font-mono text-[8px] text-zinc-500">TEMP</span>
              <span className="font-mono text-[10px] text-white font-bold">{temp.toFixed(0)}<span className="text-zinc-600 text-[8px]">°C</span></span>
          </div>
           {/* Security */}
           <div className="glass-panel p-2 flex flex-col items-center justify-center border-t-2 border-t-[#e0f2fe]">
              <ShieldCheck className="w-3 h-3 text-[#e0f2fe] mb-1" />
              <span className="font-mono text-[8px] text-zinc-500">MPK</span>
              <span className="font-mono text-[10px] text-white font-bold">SECURE</span>
          </div>
      </div>
      
      {/* Decorative Connection Line */}
      <div className="absolute -right-6 top-1/2 w-6 h-[1px] bg-gradient-to-r from-[#00f5ff]/50 to-transparent"></div>
    </div>
  );
};

export default SecureEnclaveChip;