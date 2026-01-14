"use client";
import React, { useState, useEffect } from 'react';
import { FileSignature, CheckCheck, RefreshCw } from 'lucide-react';

const PCR_VALUES = [
  { id: 'PCR[0]', label: 'BIOS_MEASUREMENT' },
  { id: 'PCR[1]', label: 'HOST_PLATFORM_CONFIG' },
  { id: 'PCR[2]', label: 'OPTION_ROM_CODE' },
  { id: 'PCR[3]', label: 'OS_LOADER_SIG' },
  { id: 'PCR[4]', label: 'SECURE_BOOT_STATE' },
  { id: 'PCR[7]', label: 'ENCLAVE_MEASUREMENT' },
];

const AttestationMonitor: React.FC = () => {
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Generate initial hashes
    const newHashes: Record<string, string> = {};
    PCR_VALUES.forEach(pcr => {
        newHashes[pcr.id] = Array(8).fill(0).map(() => Math.random().toString(16).substr(2, 4)).join('').toUpperCase();
    });
    setHashes(newHashes);

    const interval = setInterval(() => {
      setVerifying(true);
      setTimeout(() => {
        setHashes(prev => ({
            ...prev,
            'PCR[7]': Array(8).fill(0).map(() => Math.random().toString(16).substr(2, 4)).join('').toUpperCase()
        }));
        setVerifying(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 w-64">
       <div className="flex items-center justify-end gap-2 border-b border-[#e0f2fe]/20 pb-2">
         <span className="font-mono text-[10px] text-[#e0f2fe] tracking-widest uppercase">REMOTE_ATTESTATION</span>
         <FileSignature className="w-4 h-4 text-[#e0f2fe]" />
       </div>

       <div className="glass-panel p-4 flex flex-col gap-2">
            {/* Verification Status */}
            <div className="flex justify-between items-center bg-[#00f5ff]/5 p-2 rounded-sm mb-2 border border-[#00f5ff]/10">
                <span className="font-mono text-[9px] text-zinc-400">QUOTE_STATUS</span>
                {verifying ? (
                    <RefreshCw className="w-3 h-3 text-[#00f5ff] animate-spin" />
                ) : (
                    <div className="flex items-center gap-1">
                        <CheckCheck className="w-3 h-3 text-[#00f5ff]" />
                        <span className="font-mono text-[9px] text-[#00f5ff]">VALID</span>
                    </div>
                )}
            </div>

            {/* PCR Table */}
            <div className="flex flex-col gap-1.5">
                {PCR_VALUES.map((pcr) => (
                    <div key={pcr.id} className="flex flex-col group cursor-default">
                        <div className="flex justify-between items-end">
                            <span className="font-mono text-[8px] text-zinc-500">{pcr.id}</span>
                            <span className="font-mono text-[7px] text-zinc-600 group-hover:text-[#e0f2fe] transition-colors">{pcr.label}</span>
                        </div>
                        <div className="font-mono text-[8px] text-[#e0f2fe]/80 truncate tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
                            {hashes[pcr.id] || 'COMPUTING...'}
                        </div>
                        <div className="h-[1px] w-full bg-white/5 mt-1"></div>
                    </div>
                ))}
            </div>

            <div className="mt-2 text-center">
                <span className="font-mono text-[8px] text-zinc-600">ECDSA_P256 SIGNATURE VERIFIED</span>
            </div>
       </div>
    </div>
  );
};

export default AttestationMonitor;