"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, BarChart3, Lock, EyeOff } from 'lucide-react';
import ScrambleText from './ScrambleText';

// Order type definition
interface Order {
  price: string;
  amount: string;
  total: string;
  encrypted: boolean;
}

// Mock Data Generators
const generateOrder = (basePrice: number, type: 'bid' | 'ask'): Order => {
  const variation = Math.random() * 50;
  const price = type === 'ask' ? basePrice + variation : basePrice - variation;
  return {
    price: price.toFixed(2),
    amount: (Math.random() * 10).toFixed(4),
    total: (Math.random() * 50000).toFixed(2),
    encrypted: Math.random() > 0.7 // 30% chance to be "Dark Pool" hidden
  };
};

const MarketSection: React.FC = () => {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [currentPrice, setCurrentPrice] = useState(2000.00);

  useEffect(() => {
    // Init
    const initBids = Array(8).fill(0).map(() => generateOrder(currentPrice, 'bid'));
    const initAsks = Array(8).fill(0).map(() => generateOrder(currentPrice, 'ask'));
    setBids(initBids);
    setAsks(initAsks);

    const interval = setInterval(() => {
        setCurrentPrice(prev => prev + (Math.random() * 10 - 5));
        
        // Update top bid/ask
        setBids(prev => [generateOrder(currentPrice, 'bid'), ...prev.slice(0, 7)]);
        setAsks(prev => [generateOrder(currentPrice, 'ask'), ...prev.slice(0, 7)]);
    }, 800);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <section id="economy" className="py-32 relative w-full bg-[#050505] overflow-hidden border-t border-[#e0f2fe]/5">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,245,255,0.05),transparent_70%)]"></div>
      <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f5ff]/20 to-transparent"></div>

      <div className="max-w-[1600px] mx-auto px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
            <div>
                 <div className="flex items-center gap-2 mb-4">
                    <EyeOff className="w-5 h-5 text-[#e0f2fe]" />
                    <span className="font-mono text-xs text-[#e0f2fe] tracking-[0.3em] uppercase">Private_Markets</span>
                 </div>
                 <h2 className="font-display text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                    DUAL <span className="text-[#00f5ff]"><ScrambleText text="ECONOMICS" hoverTrigger={true} /></span>
                 </h2>
                 <p className="font-mono text-xs text-zinc-500 mt-4 max-w-lg leading-loose uppercase tracking-widest">
                    cUSDC for liquid stake and vault shares. Soulbound cGOV for voting. Buy cUSDC at 2000/ETH peg via the CUSDCMarketplace contract.
                 </p>
            </div>
            
            <div className="flex gap-4">
                 <div className="glass-panel px-6 py-4 flex flex-col items-end border-r-2 border-r-[#00f5ff]">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">cUSDC_Peg</span>
                    <span className="font-mono text-2xl text-white font-bold">2000/ETH</span>
                    <span className="font-mono text-[9px] text-[#00f5ff]">STABLE</span>
                 </div>
                 <div className="glass-panel px-6 py-4 flex flex-col items-end border-r-2 border-r-[#e0f2fe]">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Total_Vault_TVL</span>
                    <span className="font-mono text-2xl text-white font-bold">$1.4M</span>
                    <span className="font-mono text-[9px] text-[#e0f2fe]">GROWING</span>
                 </div>
            </div>
        </div>

        {/* Market Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px] lg:h-[500px]">
            
            {/* Chart Area (Left) */}
            <div className="lg:col-span-2 glass-panel p-1 relative overflow-hidden group">
                <div className="absolute inset-0 bg-black/40 z-0"></div>
                {/* Simulated Chart SVG */}
                <svg className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none">
                    <path d="M0,400 C150,380 300,420 450,350 S700,300 900,320 V500 H0 Z" fill="rgba(0, 245, 255, 0.05)" />
                    <path d="M0,400 C150,380 300,420 450,350 S700,300 900,320" fill="none" stroke="#00f5ff" strokeWidth="2" className="drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
                </svg>
                
                {/* Header Overlay */}
                <div className="relative z-10 p-6 flex justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#00f5ff]/10 border border-[#00f5ff]/20 rounded-sm">
                            <span className="font-mono text-white font-bold">cUSDC / ETH</span>
                        </div>
                        <span className="font-mono text-2xl text-white font-bold">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex gap-4">
                         {['1H', '4H', '1D', '1W'].map(tf => (
                             <button key={tf} className="font-mono text-xs text-zinc-500 hover:text-[#00f5ff] transition-colors">{tf}</button>
                         ))}
                    </div>
                </div>

                {/* Center "Locked" Graphic */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <Lock className="w-12 h-12 text-[#e0f2fe] mb-2" />
                    <span className="font-mono text-xs text-[#e0f2fe] bg-black/80 px-2 py-1 border border-[#e0f2fe]/20">ENCRYPTED_BALANCES</span>
                </div>
            </div>

            {/* Order Book (Right) */}
            <div className="glass-panel p-6 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <h3 className="font-mono text-xs text-[#00f5ff] tracking-widest uppercase flex items-center gap-2">
                        <Activity className="w-4 h-4" /> SWAP_CONTRACT
                    </h3>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>

                {/* Headers */}
                <div className="grid grid-cols-3 mb-2 px-2 font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
                    <span>Price (cUSDC)</span>
                    <span className="text-right">Amount (ETH)</span>
                    <span className="text-right">Total</span>
                </div>

                {/* Asks (Sell Orders) */}
                <div className="flex flex-col-reverse gap-1 mb-2 overflow-hidden h-[180px]">
                    {asks.map((ask, i) => (
                        <div key={i} className="grid grid-cols-3 px-2 py-1 hover:bg-white/5 transition-colors font-mono text-[10px] cursor-pointer group">
                             <span className="text-red-400">{ask.price}</span>
                             <span className="text-right text-zinc-300">
                                {ask.encrypted ? <span className="text-zinc-600 blur-[2px] group-hover:blur-0 transition-all">HIDDEN</span> : ask.amount}
                             </span>
                             <span className="text-right text-zinc-400">{ask.total}K</span>
                        </div>
                    ))}
                </div>

                {/* Spread */}
                <div className="py-2 border-y border-white/5 my-2 flex justify-between items-center px-2">
                     <span className="font-mono text-lg text-white font-bold">${currentPrice.toFixed(2)}</span>
                     <span className="font-mono text-[10px] text-zinc-500">Spread: 0.04%</span>
                </div>

                {/* Bids (Buy Orders) */}
                 <div className="flex flex-col gap-1 overflow-hidden h-[180px]">
                    {bids.map((bid, i) => (
                        <div key={i} className="grid grid-cols-3 px-2 py-1 hover:bg-white/5 transition-colors font-mono text-[10px] cursor-pointer group">
                             <span className="text-[#00f5ff]">{bid.price}</span>
                             <span className="text-right text-zinc-300">
                                {bid.encrypted ? <span className="text-zinc-600 blur-[2px] group-hover:blur-0 transition-all">HIDDEN</span> : bid.amount}
                             </span>
                             <span className="text-right text-zinc-400">{bid.total}K</span>
                        </div>
                    ))}
                </div>

                {/* Depth Visualizer at bottom */}
                <div className="mt-auto h-1 w-full flex">
                    <div className="h-full bg-[#00f5ff] w-[45%]"></div>
                    <div className="h-full bg-zinc-800 w-[10%]"></div>
                    <div className="h-full bg-red-400 w-[45%]"></div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default MarketSection;