"use client";

import { useState, useRef, useEffect } from "react";
import { usePrivy, useLogin, useLogout, useWallets } from "@privy-io/react-auth";
import { Loader2, Copy, LogOut, Check, ChevronDown } from "lucide-react";

interface WalletConnectProps {
  collapsed?: boolean;
}

export function WalletConnect({ collapsed = false }: WalletConnectProps) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin();
  const { logout } = useLogout();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyAddress = async () => {
    const wallet = wallets[0];
    if (wallet?.address) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    setShowDropdown(false);
    logout();
  };

  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      await login();
    } finally {
      setIsConnecting(false);
    }
  };

  // Reset connecting state when authenticated
  useEffect(() => {
    if (authenticated) {
      setIsConnecting(false);
    }
  }, [authenticated]);

  // Loading state while Privy initializes
  if (!ready) {
    return (
      <button
        disabled
        className={`group relative overflow-hidden bg-transparent border border-[#00f5ff]/20 transition-all duration-300 ${
          collapsed ? "px-3 py-1.5 sm:px-4 sm:py-2" : "px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3"
        }`}
      >
        <span
          className={`relative z-10 font-mono font-bold tracking-[0.15em] sm:tracking-[0.2em] text-[#00f5ff]/50 flex items-center gap-1 sm:gap-1.5 lg:gap-2 ${
            collapsed ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]"
          }`}
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="hidden xs:inline">LOADING</span>
        </span>
      </button>
    );
  }

  // Not authenticated - show connect button
  if (!authenticated) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`group relative overflow-hidden bg-transparent border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
          collapsed ? "px-3 py-1.5 sm:px-4 sm:py-2" : "px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3"
        }`}
      >
        {/* Background Fill Animation */}
        <div className="absolute inset-0 w-full h-full bg-[#00f5ff]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>

        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 border-t border-l border-[#00f5ff] opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 border-b border-r border-[#00f5ff] opacity-50 group-hover:opacity-100 transition-opacity"></div>

        {/* Content */}
        <span
          className={`relative z-10 font-mono font-bold tracking-[0.15em] sm:tracking-[0.2em] text-[#00f5ff] group-hover:text-white transition-colors duration-300 flex items-center gap-1 sm:gap-1.5 lg:gap-2 ${
            collapsed ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]"
          }`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden xs:inline">CONNECTING</span>
            </>
          ) : (
            <>
              <span
                className={`bg-[#00f5ff] rounded-none group-hover:animate-ping ${
                  collapsed ? "w-0.5 h-0.5 sm:w-1 sm:h-1" : "w-1 h-1 sm:w-1.5 sm:h-1.5"
                }`}
              ></span>
              <span className="hidden xs:inline">CONNECT</span>
              <span className="xs:hidden">WALLET</span>
            </>
          )}
        </span>
      </button>
    );
  }

  // Authenticated - show address with dropdown
  const wallet = wallets[0];
  const address = wallet?.address;
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connected";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
      {/* Chain Badge */}
      {!collapsed && (
        <div className="hidden sm:block group relative px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2 overflow-hidden bg-transparent border border-[#e0f2fe]/20 hover:border-[#e0f2fe]/50 transition-colors duration-300">
          <div className="absolute inset-0 w-full h-full bg-[#e0f2fe]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <span className="relative z-10 font-mono text-[8px] sm:text-[9px] tracking-[0.1em] sm:tracking-[0.15em] text-[#e0f2fe] group-hover:text-white transition-colors duration-300 flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0052FF] flex items-center justify-center">
              <span className="text-white text-[6px] font-bold">B</span>
            </div>
            <span className="hidden lg:inline">Base Sepolia</span>
          </span>
        </div>
      )}

      {/* Account Button with Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`group relative overflow-hidden bg-transparent border border-[#00f5ff]/20 hover:border-[#00f5ff]/50 transition-all duration-300 ${
            collapsed ? "px-3 py-1.5 sm:px-4 sm:py-2" : "px-4 py-2 sm:px-5 sm:py-2.5 lg:px-6 lg:py-3"
          }`}
        >
          <div className="absolute inset-0 w-full h-full bg-[#00f5ff]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <div className="absolute top-0 left-0 w-1.5 h-1.5 sm:w-2 sm:h-2 border-t border-l border-[#00f5ff] opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 border-b border-r border-[#00f5ff] opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <span
            className={`relative z-10 font-mono font-bold tracking-[0.15em] sm:tracking-[0.2em] text-[#00f5ff] group-hover:text-white transition-colors duration-300 flex items-center gap-1 sm:gap-1.5 lg:gap-2 ${
              collapsed ? "text-[8px] sm:text-[9px]" : "text-[9px] sm:text-[10px]"
            }`}
          >
            <span
              className={`bg-green-500 rounded-full animate-pulse ${
                collapsed ? "w-0.5 h-0.5 sm:w-1 sm:h-1" : "w-1 h-1 sm:w-1.5 sm:h-1.5"
              }`}
            ></span>
            <span className="max-w-[60px] sm:max-w-[80px] lg:max-w-none truncate">
              {shortAddress}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
          </span>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 border border-[#00f5ff]/30 backdrop-blur-sm z-50 overflow-hidden">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f5ff]"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f5ff]"></div>
            
            {/* Full Address Display */}
            <div className="px-4 py-3 border-b border-[#00f5ff]/10">
              <p className="font-mono text-[8px] text-[#e0f2fe]/50 tracking-wider uppercase mb-1">Connected Wallet</p>
              <p className="font-mono text-[10px] text-[#00f5ff] break-all">{address}</p>
            </div>
            
            {/* Copy Address */}
            <button
              onClick={handleCopyAddress}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#00f5ff]/10 transition-colors duration-200 group"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-[#e0f2fe]/60 group-hover:text-[#00f5ff] transition-colors" />
              )}
              <span className="font-mono text-[10px] tracking-wider text-[#e0f2fe]/80 group-hover:text-white transition-colors">
                {copied ? "COPIED!" : "COPY ADDRESS"}
              </span>
            </button>
            
            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors duration-200 group border-t border-[#00f5ff]/10"
            >
              <LogOut className="w-4 h-4 text-[#e0f2fe]/60 group-hover:text-red-400 transition-colors" />
              <span className="font-mono text-[10px] tracking-wider text-[#e0f2fe]/80 group-hover:text-red-400 transition-colors">
                DISCONNECT
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
