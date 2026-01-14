"use client";
import React from 'react';
import { Globe, Server, Activity, ShieldCheck } from 'lucide-react';
import ScrambleText from './ScrambleText';

const NetworkMapSection: React.FC = () => {
  // Simple nodes coordinates for a mock map
  const nodes = [
    { id: 1, x: 20, y: 30, label: "NODE_INCO" },
    { id: 2, x: 45, y: 25, label: "NODE_NILLION" },
    { id: 3, x: 75, y: 35, label: "TEE_CLUSTER_01" },
    { id: 4, x: 60, y: 60, label: "TEE_CLUSTER_02" },
    { id: 5, x: 30, y: 55, label: "BASE_RPC" },
    { id: 6, x: 85, y: 80, label: "AGENT_SWARM" }
  ];

  // Connections between nodes
  const connections = [
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 5 },
    { from: 5, to: 1 },
    { from: 4, to: 6 },
    { from: 3, to: 6 }
  ];

  return (
    <section id="infrastructure" className="py-32 relative w-full bg-[#050505] overflow-hidden">
      {/* Background Decor */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]"></div>

      <div className="max-w-[1600px] mx-auto px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
                 <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-[#00f5ff]" />
                    <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">GLOBAL_INFRASTRUCTURE</span>
                 </div>
                 <h2 className="font-display text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                    DECENTRALIZED <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] to-[#e0f2fe]"><ScrambleText text="COMPUTE" hoverTrigger={true} /></span>
                 </h2>
            </div>
            <div className="flex gap-8">
                <div className="text-right">
                    <div className="font-mono text-2xl text-white font-bold">142</div>
                    <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Active_TEE_Nodes</div>
                </div>
                 <div className="text-right">
                    <div className="font-mono text-2xl text-[#00f5ff] font-bold">12ms</div>
                    <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Inference_Latency</div>
                </div>
            </div>
        </div>

        {/* Map Visualization */}
        <div className="relative aspect-[16/9] w-full border border-[#e0f2fe]/10 bg-[#080808] overflow-hidden group">
            
            {/* Overlay Scanline */}
            <div className="absolute top-0 w-full h-[2px] bg-[#00f5ff]/30 shadow-[0_0_15px_#00f5ff] animate-scan-beam z-20"></div>

            <svg className="w-full h-full p-12" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Connections */}
                {connections.map((conn, idx) => {
                    const fromNode = nodes.find(n => n.id === conn.from);
                    const toNode = nodes.find(n => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    return (
                        <g key={idx}>
                            <line 
                                x1={fromNode.x} y1={fromNode.y} 
                                x2={toNode.x} y2={toNode.y} 
                                stroke="rgba(224, 242, 254, 0.1)" 
                                strokeWidth="0.2" 
                            />
                            {/* Animated Packet */}
                            <circle r="0.5" fill="#00f5ff">
                                <animateMotion 
                                    dur={`${Math.random() * 2 + 2}s`} 
                                    repeatCount="indefinite"
                                    path={`M${fromNode.x},${fromNode.y} L${toNode.x},${toNode.y}`}
                                />
                            </circle>
                             <circle r="0.5" fill="#e0f2fe">
                                <animateMotion 
                                    dur={`${Math.random() * 2 + 3}s`} 
                                    repeatCount="indefinite"
                                    path={`M${toNode.x},${toNode.y} L${fromNode.x},${fromNode.y}`}
                                />
                            </circle>
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map(node => (
                    <g key={node.id} className="cursor-pointer hover:opacity-100 transition-opacity">
                        {/* Outer Glow Ring */}
                        <circle cx={node.x} cy={node.y} r="3" fill="none" stroke="#00f5ff" strokeWidth="0.1" className="opacity-0 group-hover:opacity-30 transition-opacity animate-pulse" />
                        
                        {/* Core */}
                        <circle cx={node.x} cy={node.y} r="1" fill="#050505" stroke="#00f5ff" strokeWidth="0.5" />
                        
                        {/* Label */}
                        <text x={node.x + 2} y={node.y + 0.5} fontSize="2" fill="#e0f2fe" fontFamily="JetBrains Mono" className="opacity-50">
                            {node.label}
                        </text>
                    </g>
                ))}
            </svg>
            
            {/* Status Panel Overlay */}
            <div className="absolute bottom-4 left-4 p-4 glass-panel border border-[#00f5ff]/20">
                 <div className="flex items-center gap-3 mb-2">
                    <Server className="w-4 h-4 text-[#e0f2fe]" />
                    <span className="font-mono text-[10px] text-white tracking-widest">VALIDATOR_STATUS: ONLINE</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-[9px] text-zinc-400">ENCRYPTION: TFHE</span>
                 </div>
            </div>
            
             {/* Security Layer Overlay */}
            <div className="absolute top-4 right-4 p-4 glass-panel border border-[#00f5ff]/20 text-right">
                 <div className="flex items-center justify-end gap-3 mb-2">
                    <span className="font-mono text-[10px] text-white tracking-widest">NILDB_STORAGE</span>
                    <ShieldCheck className="w-4 h-4 text-[#00f5ff]" />
                 </div>
                 <div className="font-mono text-[9px] text-zinc-400">
                    <span className="text-[#00f5ff]">142</span> TB ENCRYPTED
                 </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default NetworkMapSection;