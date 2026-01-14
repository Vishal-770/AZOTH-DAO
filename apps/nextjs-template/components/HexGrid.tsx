import React from 'react';

const HexGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
      <svg className="w-full h-full" width="100%" height="100%">
        <defs>
          <pattern id="hex-grid" width="40" height="68" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
            <path d="M20 0 L40 17 L40 51 L20 68 L0 51 L0 17 Z" fill="none" stroke="rgba(0, 245, 255, 0.3)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid)" />
        
        {/* Animated Highlights */}
        <circle cx="20%" cy="30%" r="100" fill="url(#hex-grid)" className="animate-pulse opacity-50">
             <animate attributeName="opacity" values="0;0.5;0" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      {/* Radial fade out to blend with background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]"></div>
    </div>
  );
};

export default HexGrid;