"use client";
import React from 'react';
import { User, MapPin, Globe, Fingerprint } from 'lucide-react';
import ScrambleText from './ScrambleText';

const SessionInfo: React.FC = () => {
  return (
    <div className="flex">
      <div className="glass-panel p-5 border-t-2 border-t-[#00f5ff] flex gap-8">
        
        {/* Identity Column */}
        <div className="flex flex-col gap-3 border-r border-white/5 pr-6">
            <div className="flex items-center gap-2 text-zinc-500">
                <User className="w-3 h-3" />
                <span className="font-mono text-[8px] tracking-widest uppercase">Agent_Identity</span>
            </div>
            <div className="font-mono text-sm text-[#00f5ff] font-bold">
                ERC-8004
            </div>
            <div className="font-mono text-[9px] text-zinc-600">
                0x5d...Ae1e7
            </div>
        </div>

        {/* Location Column */}
        <div className="flex flex-col gap-3 border-r border-white/5 pr-6">
            <div className="flex items-center gap-2 text-zinc-500">
                <MapPin className="w-3 h-3" />
                <span className="font-mono text-[8px] tracking-widest uppercase">Network_Layer</span>
            </div>
            <div className="font-mono text-sm text-white font-bold flex items-center gap-2">
                <ScrambleText text="INCO_TEE_MAIN" hoverTrigger={true} />
            </div>
            <div className="font-mono text-[9px] text-green-500 flex items-center gap-1">
                <Globe className="w-3 h-3" /> ENCRYPTION_ACTIVE
            </div>
        </div>

         {/* Connection Column */}
         <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-zinc-500">
                <Fingerprint className="w-3 h-3" />
                <span className="font-mono text-[8px] tracking-widest uppercase">x402_Balance</span>
            </div>
            <div className="font-mono text-sm text-[#e0f2fe] font-bold">
                124.50 CRED
            </div>
            <div className="w-24 h-1 bg-zinc-800 mt-1">
                <div className="h-full bg-[#e0f2fe] animate-[pulse_0.5s_infinite]" style={{ width: '92%' }}></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SessionInfo;