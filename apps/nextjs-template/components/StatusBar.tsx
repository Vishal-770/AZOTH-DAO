"use client";
import React, { useState, useEffect } from 'react';
import { Wifi, Radio } from 'lucide-react';

const StatusBar: React.FC = () => {
  const [time, setTime] = useState<string>('00:00:00');
  
  // Generate random hex string for the marquee
  const hexStream = Array(50).fill(0).map(() => 
    Math.random().toString(16).substring(2, 10).toUpperCase()
  ).join('  //  ');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.getHours().toString().padStart(2, '0') + ':' + 
        now.getMinutes().toString().padStart(2, '0') + ':' + 
        now.getSeconds().toString().padStart(2, '0')
      );
    };
    const timer = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="border-y border-[#e0f2fe]/10 bg-[#050505]/95 relative z-20 backdrop-blur-sm shadow-[0_0_20px_rgba(0,245,255,0.05)] overflow-hidden h-10 flex items-center">
      
      {/* Background Marquee Layer */}
      <div className="absolute inset-0 flex items-center opacity-10 pointer-events-none select-none overflow-hidden">
        <div className="whitespace-nowrap animate-marquee font-mono text-[9px] text-[#00f5ff] tracking-widest">
            {hexStream} {hexStream} {hexStream}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 w-full flex justify-between items-center relative z-10">
        <div className="flex gap-12 font-mono text-[9px] tracking-[0.3em] text-[#00f5ff]/90 hover:text-[#00f5ff] transition-colors duration-300">
          <div className="flex items-center gap-3 hover:text-[#00f5ff] cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
            <Radio className="w-3 h-3 text-[#00f5ff] animate-pulse" />
            <span className="hidden sm:inline">NET_INTEGRITY: 100%</span>
          </div>
          <div className="hidden md:block text-[#e0f2fe]/80 hover:text-[#00f5ff] cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
            HASH_RATE: <span className="text-white hover:text-[#00f5ff] transition-colors">844 TH/S</span>
          </div>
        </div>
        
        <div className="font-mono text-[9px] text-zinc-400 tracking-[0.2em] flex items-center gap-4 hover:text-[#00f5ff] transition-colors duration-300">
            <span className="hidden sm:inline hover:text-[#00f5ff] cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
              SESSION_ID: <span className="text-zinc-300 hover:text-white transition-colors">0x9F...3A2</span>
            </span>
            <div className="h-3 w-[1px] bg-zinc-700"></div>
            <span className="text-zinc-300 hover:text-[#00f5ff] cursor-pointer transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">{time}</span> 
            <Wifi className="w-3 h-3 text-[#00f5ff] hover:animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default StatusBar;