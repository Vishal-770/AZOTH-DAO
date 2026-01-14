import React, { useState, useEffect } from 'react';
import { FileWarning, CheckCircle2, Hash } from 'lucide-react';

const EVENTS = [
  { type: 'info', text: 'NILDB_STORE_ENCRYPTED_CHUNK' },
  { type: 'success', text: 'CGOV_SOULBOUND_MINTED' },
  { type: 'warning', text: 'X402_PAYMENT_PENDING' },
  { type: 'info', text: 'INCO_TEE_VOTE_CAST_0x8' },
  { type: 'info', text: 'TEE_AGENT_INFERENCE_START' },
  { type: 'success', text: 'VAULT_SHARES_ISSUED' },
  { type: 'info', text: 'REBALANCING_CUSDC_POOL' },
  { type: 'warning', text: 'NILAI_QUERY_COMPUTING' },
];

const EncryptedDataStream: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Initial population
    setLogs(EVENTS.slice(0, 4).map((e, i) => ({ ...e, id: i, time: Date.now() })));

    const interval = setInterval(() => {
      setLogs(prev => {
        const newEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        const newLog = { 
            ...newEvent, 
            id: Date.now(), 
            time: Date.now() 
        };
        // Keep last 6 logs
        return [newLog, ...prev].slice(0, 6);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-72 flex flex-col gap-4 pointer-events-none">
      <div className="flex items-center gap-2 border-b border-[#00f5ff]/20 pb-2 mb-2">
        <Hash className="w-4 h-4 text-[#00f5ff]" />
        <span className="font-mono text-[10px] text-[#00f5ff] tracking-widest uppercase">NILLION_DATA_FEED</span>
      </div>

      <div className="flex flex-col gap-3 relative">
         {/* Fade mask at bottom */}
         <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#050505] to-transparent z-10"></div>

         {logs.map((log, index) => (
             <div 
                key={log.id} 
                className="flex items-start gap-3 transition-all duration-500 ease-in-out"
                style={{ 
                    opacity: 1 - (index * 0.15),
                    transform: `translateY(${index * 2}px)`
                }}
             >
                <div className="mt-1">
                    {log.type === 'warning' ? (
                        <FileWarning className="w-3 h-3 text-red-500/80 animate-pulse" />
                    ) : log.type === 'success' ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500/80" />
                    ) : (
                        <div className="w-1.5 h-1.5 bg-[#00f5ff] rounded-full mt-1"></div>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="font-mono text-[9px] text-[#e0f2fe] tracking-wider">{log.text}</span>
                    <span className="font-mono text-[7px] text-zinc-600">HASH: {Math.random().toString(16).substr(2, 12).toUpperCase()}</span>
                </div>
             </div>
         ))}
      </div>
    </div>
  );
};

export default EncryptedDataStream;