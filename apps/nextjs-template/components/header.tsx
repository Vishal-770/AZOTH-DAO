'use client';

import { Gem, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { WalletConnect } from './wallet-connect';

const Header = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${collapsed ? 'h-12' : 'h-16'}`}>
      <div className="h-full glass-panel border-b border-[#e0f2fe]/5">
        <div className="h-full max-w-full mx-auto flex items-center justify-between px-4 lg:px-6">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#00f5ff] blur-sm opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <img src="/dao-logo.png" alt="Azoth DAO" className={`relative z-10 transition-all duration-300 ${collapsed ? 'w-5 h-5' : 'w-6 h-6'} object-contain`} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="font-display font-bold text-base lg:text-lg tracking-[0.2em] text-white uppercase">
                  Azoth DAO
                </h1>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-mono text-[8px] text-[#e0f2fe]/50 tracking-[0.3em]">ONLINE</span>
                </div>
              </div>
            )}
            {collapsed && (
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#00f5ff] font-bold">AZOTH</span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Network Badge */}
            {!collapsed && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 border border-[#e0f2fe]/10 bg-[#e0f2fe]/5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="font-mono text-[9px] tracking-[0.15em] text-[#e0f2fe]">BASE</span>
              </div>
            )}

            {/* Privy Wallet Connect Button */}
            <WalletConnect collapsed={collapsed} />

            {/* Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-2 p-1.5 border border-[#e0f2fe]/10 hover:border-[#00f5ff]/30 transition-all hover:bg-[#00f5ff]/5"
              title={collapsed ? "Expand header" : "Collapse header"}
            >
              {collapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#00f5ff]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#00f5ff]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
       