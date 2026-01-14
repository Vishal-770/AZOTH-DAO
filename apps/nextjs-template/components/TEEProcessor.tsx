"use client";
import React, { useState, useEffect } from 'react';
import { Cpu, Lock, ShieldCheck, Zap } from 'lucide-react';

const TEEProcessor: React.FC = () => {
  const [load, setLoad] = useState(45);
  const [temp, setTemp] = useState(62);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoad(prev => Math.min(100, Math.max(20, prev + (Math.random() * 20 - 10))));
      setTemp(prev => Math.min(90, Math.max(50, prev + (Math.random() * 5 - 2.5))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 w-64 pointer-events-none">
      <div className="flex items-center justify-end gap-2 border-b border-[#00f5ff]/20 pb-2 mb-2">
        <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest uppercase">SECURE_ENCLAVE_H9</span>
        <Cpu className="w-4 h-4 text-[#00f5ff]" />
      </div>

      <div className="relative glass-panel p-4 flex flex-col items-center">
        {/* Processor Visual */}
        <div className="relative w-32 h-32 bg-[#0a0a0a] border border-[#333] rounded-md flex items-center justify-center mb-4 overflow-hidden">
             {/* Circuit Patterns */}
             <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(0,245,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[background-position_0%_0%_to_100%_100%_20s_linear_infinite]"></div>
             
             {/* Core */}
             <div className="relative w-16 h-16 border border-[#00f5ff]/50 bg-[#00f5ff]/5 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.2)]">
                <Lock className="w-6 h-6 text-[#00f5ff] animate-pulse" />
                
                {/* Rotating Ring */}
                <div className="absolute inset-[-4px] border-t border-l border-[#00f5ff] rounded-full animate-spin"></div>
             </div>

             {/* Data Lines */}
             <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-[#00f5ff]/50"></div>
             <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-[#00f5ff]/50"></div>
             <div className="absolute bottom-0 left-1/2 w-[1px] h-8 bg-[#00f5ff]/50"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 w-full">
            <div className="bg-black/40 p-2 border border-white/5 flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-[#e0f2fe]" />
                    <span className="text-[8px] font-mono text-zinc-400">LOAD</span>
                </div>
                <span className="text-xs font-mono text-white">{load.toFixed(0)}%</span>
            </div>
            <div className="bg-black/40 p-2 border border-white/5 flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-3 h-3 text-[#00f5ff]" />
                    <span className="text-[8px] font-mono text-zinc-400">TEMP</span>
                </div>
                <span className="text-xs font-mono text-white">{temp.toFixed(1)}°C</span>
            </div>
        </div>

        {/* Isolation Status */}
        <div className="mt-3 w-full border-t border-white/5 pt-2 flex justify-between items-center">
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Memory_Encryption</span>
            <span className="text-[8px] font-mono text-[#00f5ff] animate-pulse">ACTIVE (MEK-128)</span>
        </div>
      </div>
    </div>
  );
};

export default TEEProcessor;