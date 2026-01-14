"use client";
import React, { useState, useEffect } from 'react';
import { Shield, RefreshCcw } from 'lucide-react';

const SecurityGateStatus: React.FC = () => {
  const [keyRotation, setKeyRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setKeyRotation(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-64">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#00f5ff]/20 pb-2">
        <Shield className="w-4 h-4 text-[#00f5ff]" />
        <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest uppercase">SECURITY_GATES_ACTIVE</span>
      </div>

      {/* Layer 1 */}
      <div className="glass-panel p-3 border-l-2 border-l-[#00f5ff]">
        <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[9px] text-zinc-400">LAYER_01: TOR_PROXY</span>
            <span className="font-mono text-[9px] text-[#00f5ff] animate-pulse">ROUTED</span>
        </div>
        <div className="h-[2px] w-full bg-[#00f5ff]/10">
            <div className="h-full bg-[#00f5ff] w-full animate-[pulse_3s_infinite]"></div>
        </div>
      </div>

      {/* Layer 2 */}
      <div className="glass-panel p-3 border-l-2 border-l-[#e0f2fe]">
        <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[9px] text-zinc-400">LAYER_02: ZK_SNARK</span>
            <span className="font-mono text-[9px] text-[#e0f2fe]">VERIFIED</span>
        </div>
        <div className="h-[2px] w-full bg-[#e0f2fe]/10">
            <div className="h-full bg-[#e0f2fe] w-3/4"></div>
        </div>
      </div>

       {/* Key Rotation Visual */}
       <div className="glass-panel p-3 flex items-center gap-4">
            <RefreshCcw className="w-5 h-5 text-zinc-500 animate-[spin_4s_linear_infinite]" />
            <div className="flex flex-col w-full">
                <span className="font-mono text-[8px] text-zinc-500 uppercase mb-1">Rotating_Session_Keys</span>
                <div className="h-1 bg-zinc-800 w-full overflow-hidden">
                    <div className="h-full bg-zinc-500" style={{ width: `${keyRotation}%` }}></div>
                </div>
                <span className="font-mono text-[8px] text-[#00f5ff] mt-1 text-right">{keyRotation}%</span>
            </div>
       </div>
    </div>
  );
};

export default SecurityGateStatus;