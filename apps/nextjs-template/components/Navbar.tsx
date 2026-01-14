'use client';

import React, { useState } from 'react';
import { Gem, ChevronDown, ChevronUp } from 'lucide-react';
import { WalletConnect } from './wallet-connect';

const NavItem = ({ href, label }: { href: string; label: string }) => {
  return (
    <a
      href={href}
      className="group relative font-mono text-[10px] tracking-widest text-zinc-400 transition-colors duration-300 hover:text-white"
    >
      {/* Left Bracket */}
      <span className="absolute -left-2 top-0 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-left-3 text-[#00f5ff] font-light">
        [
      </span>
      
      {/* Label */}
      <span className="relative z-10 group-hover:text-shadow-glow transition-all duration-300">
        {label}
      </span>
      
      {/* Right Bracket */}
      <span className="absolute -right-2 top-0 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-right-3 text-[#00f5ff] font-light">
        ]
      </span>

      {/* Bottom Glow Line */}
      <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out opacity-50"></span>
    </a>
  );
};

const Navbar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
      <div className="max-w-[1400px] mx-auto bg-[#050505]/90 backdrop-blur-md border border-[#e0f2fe]/5 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(0,245,255,0.05)] transition-all duration-300">
        {/* Compact Header Bar */}
        <div className={`flex justify-between items-center px-3 sm:px-4 lg:px-6 transition-all duration-300 ${isCollapsed ? 'h-12 sm:h-14' : 'h-14 sm:h-16 lg:h-20'}`}>
          {/* Logo Section */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00f5ff] blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <img src="/dao-logo.png" alt="Azoth DAO" className={`relative z-10 transition-all duration-700 ease-in-out ${isCollapsed ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8'} object-contain`} />
            </div>
            <div className="flex flex-col">
              <span className={`font-display font-bold tracking-[0.15em] sm:tracking-[0.2em] lg:tracking-[0.25em] text-white uppercase group-hover:text-shadow-glow transition-all duration-300 ${isCollapsed ? 'text-xs sm:text-sm' : 'text-sm sm:text-base lg:text-xl'}`}>
                <span className="hidden sm:inline">Azoth_DAO</span>
                <span className="sm:hidden">AP</span>
              </span>
              {!isCollapsed && (
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-mono text-[7px] sm:text-[8px] lg:text-[9px] text-[#e0f2fe]/50 tracking-[0.2em] sm:tracking-[0.3em] lg:tracking-[0.4em] group-hover:text-[#00f5ff]/80 transition-colors">
                    <span className="hidden sm:inline">INTERFACE_</span>ONLINE
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Nav Links + Wallet + Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            {/* Nav Links - Hidden on mobile, visible on desktop */}
            {!isCollapsed && (
              <div className="hidden lg:flex items-center gap-6 xl:gap-12 mr-4">
                <NavItem href="#core" label="THE_SHARD" />
                <NavItem href="#protocols" label="ENCRYPTION_LOGS" />
                <NavItem href="#sigils" label="DAO_GOVERNANCE" />
              </div>
            )}
          
            {/* Privy Wallet Connect Button */}
            <WalletConnect collapsed={isCollapsed} />

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="group relative p-1.5 sm:p-2 border border-[#e0f2fe]/20 hover:border-[#00f5ff]/50 bg-[#050505]/50 hover:bg-[#00f5ff]/5 transition-all duration-300 rounded ml-1 sm:ml-2"
              aria-label={isCollapsed ? 'Expand navbar' : 'Collapse navbar'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-[#e0f2fe]/70 group-hover:text-[#00f5ff] transition-colors" />
              ) : (
                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#e0f2fe]/70 group-hover:text-[#00f5ff] transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded Content - Mobile Nav Links */}
        {!isCollapsed && (
          <div className="lg:hidden border-t border-[#e0f2fe]/5 px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <NavItem href="#core" label="THE_SHARD" />
              <NavItem href="#protocols" label="ENCRYPTION_LOGS" />
              <NavItem href="#sigils" label="DAO_GOVERNANCE" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;