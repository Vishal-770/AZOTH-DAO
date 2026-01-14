"use client";
import React, { useState, useEffect } from 'react';
import { Box, Layers, Zap } from 'lucide-react';
import ScrambleText from './ScrambleText';

const ConsensusStatus: React.FC = () => {
  const [blockHeight, setBlockHeight] = useState(18293442);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight(prev => prev + 1);
    }, 4500); // Approx block time
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="block">
      <div className="glass-panel p-4 border-l-4 border-l-[#e0f2fe] flex items-center gap-6">
        
        {/* Animated Cube Icon */}
        <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 border border-[#00f5ff] animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-2 border border-[#e0f2fe] animate-[spin_6s_linear_infinite_reverse]"></div>
            <Box className="w-4 h-4 text-white" />
        </div>

        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-zinc-400 tracking-widest uppercase">Base_Sepolia_L2</span>
                <span className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full animate-pulse shadow-[0_0_5px_#00f5ff]"></span>
            </div>
            
            <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl text-white font-bold tracking-tighter">
                    #{blockHeight.toLocaleString()}
                </span>
                <span className="font-mono text-[9px] text-[#00f5ff] animate-pulse">LIVE</span>
            </div>

            <div className="flex gap-4 mt-1 border-t border-white/5 pt-2">
                <div className="flex items-center gap-1" title="Shard Depth">
                    <Layers className="w-3 h-3 text-zinc-500" />
                    <span className="font-mono text-[8px] text-zinc-400">INCO_SHARDS: Active</span>
                </div>
                <div className="flex items-center gap-1" title="Finality Time">
                    <Zap className="w-3 h-3 text-zinc-500" />
                    <span className="font-mono text-[8px] text-zinc-400">CONFIRMED</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConsensusStatus;