import React from 'react';

const CipherRings: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none relative flex items-center justify-center opacity-40 ${className}`}>
      {/* Outer Ring: Dashed */}
      <div className="absolute rounded-full w-[600px] h-[600px] animate-[spin_60s_linear_infinite]">
         <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="4 2" className="text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]" />
         </svg>
      </div>
      
      {/* Middle Ring: Counter Rotation with Nodes */}
      <div className="absolute rounded-full w-[450px] h-[450px] animate-[spin_40s_linear_infinite_reverse]">
        <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="10 10" className="text-[#e0f2fe] drop-shadow-[0_0_6px_rgba(224,242,254,0.5)]" />
            <circle cx="50" cy="1" r="1.5" fill="currentColor" className="text-[#00f5ff] drop-shadow-[0_0_4px_rgba(0,245,255,0.8)]" />
            <circle cx="50" cy="99" r="1.5" fill="currentColor" className="text-[#00f5ff] drop-shadow-[0_0_4px_rgba(0,245,255,0.8)]" />
         </svg>
      </div>
      
      {/* Inner Ring: Hex Data Simulation */}
      <div className="absolute rounded-full w-[300px] h-[300px] animate-[spin_20s_linear_infinite]">
         <svg className="w-full h-full" viewBox="0 0 100 100">
            <path d="M50 5 A45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" className="text-[#00f5ff] drop-shadow-[0_0_6px_rgba(0,245,255,0.7)]" />
            <path d="M50 95 A45 45 0 0 1 5 50" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" className="text-[#00f5ff] drop-shadow-[0_0_6px_rgba(0,245,255,0.7)]" />
         </svg>
      </div>
      
      {/* Core Target */}
      <div className="absolute w-[150px] h-[150px] border border-[#00f5ff]/40 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.3)]">
        <div className="absolute w-full h-[1px] bg-[#00f5ff]/50 shadow-[0_0_8px_rgba(0,245,255,0.5)]"></div>
        <div className="absolute h-full w-[1px] bg-[#00f5ff]/50 shadow-[0_0_8px_rgba(0,245,255,0.5)]"></div>
        <div className="w-[100px] h-[100px] border-2 border-dashed border-[#e0f2fe]/50 rounded-full animate-pulse shadow-[0_0_10px_rgba(224,242,254,0.4)]"></div>
      </div>
    </div>
  );
};
export default CipherRings;