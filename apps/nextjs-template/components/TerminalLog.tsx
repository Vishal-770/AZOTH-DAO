"use client";
import React, { useState, useEffect } from 'react';

const LOGS = [
  "INITIALIZING_HANDSHAKE...",
  "VERIFYING_ZERO_KNOWLEDGE_PROOF...",
  "DECRYPTING_NODE_0x884...",
  "ACCESS_TOKEN_REFRESHED",
  "SCANNING_MEMPOOL...",
  "WARNING: ANOMALY_DETECTED_SECTOR_7",
  "REROUTING_TRAFFIC...",
  "ESTABLISHING_SECURE_TUNNEL",
  "SYNC_COMPLETE",
  "UPDATING_LEDGER_STATE...",
  "EXECUTING_SMART_CONTRACT_0x99",
  "PACKET_LOSS: 0.0001%",
  "ENCRYPTION_KEY_ROTATION_PENDING"
];

const TerminalLog: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    // Fill initial buffer
    setLines(LOGS.slice(0, 3).map(l => `> ${l}`));

    const interval = setInterval(() => {
      setLines(prev => {
        const newLine = LOGS[Math.floor(Math.random() * LOGS.length)];
        const newLines = [...prev, `> ${newLine}`];
        if (newLines.length > 5) newLines.shift(); // Keep last 5 lines
        return newLines;
      });
    }, 1500); // Speed of updates
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[9px] text-[#00f5ff]/60 leading-relaxed pointer-events-none select-none">
      <div className="mb-2 border-b border-[#00f5ff]/20 pb-1 text-xs font-bold text-[#00f5ff]">
         SYSTEM_OUTPUT_LOG
      </div>
      {lines.map((line, i) => (
        <div key={i} className="animate-pulse">{line}</div>
      ))}
      <div className="animate-pulse mt-1 text-[#00f5ff]">_</div>
    </div>
  );
};
export default TerminalLog;