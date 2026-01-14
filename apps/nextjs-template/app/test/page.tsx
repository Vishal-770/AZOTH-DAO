"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { formatUnits, parseEther } from "viem";

// Import Inco utilities
import { 
  getConfig, 
  encryptValue, 
  decryptValue, 
  getFee,
  isValidHandle,
  publicClient as incoPublicClient,
} from "@/utils/inco";

// Import contract constants
import { 
  CUSDC_MARKETPLACE_ADDRESS, 
  CUSDC_MARKETPLACE_ABI,
} from "@/utils/constants";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
  duration?: number;
}

export default function PrivyIncoTestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Privy hooks
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wagmiPublicClient = usePublicClient();
  const { data: walletClient, isLoading: walletLoading } = useWalletClient();

  const updateTest = (name: string, update: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.name === name ? { ...t, ...update } : t));
  };

  const runAllTests = async () => {
    if (!authenticated || !walletClient) {
      alert("Please connect your wallet first");
      return;
    }

    setIsRunning(true);

    const testList: TestResult[] = [
      { name: "1. Privy Authentication", status: "pending" },
      { name: "2. Wagmi Connection", status: "pending" },
      { name: "3. Wallet Client Availability", status: "pending" },
      { name: "4. Chain Configuration", status: "pending" },
      { name: "5. Inco Config Loading", status: "pending" },
      { name: "6. Inco Fee Fetching", status: "pending" },
      { name: "7. Read Contract (cUSDC Handle)", status: "pending" },
      { name: "8. Encryption Test", status: "pending" },
      { name: "9. Decryption Compatibility", status: "pending" },
    ];

    setTests(testList);

    // Test 1: Privy Authentication
    try {
      updateTest("1. Privy Authentication", { status: "running" });
      const start = Date.now();
      
      if (!ready) throw new Error("Privy not ready");
      if (!authenticated) throw new Error("Not authenticated");
      if (!user) throw new Error("No user object");
      
      updateTest("1. Privy Authentication", { 
        status: "success", 
        message: `User: ${user.email?.address || user.wallet?.address?.slice(0, 10) + "..."}`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("1. Privy Authentication", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 2: Wagmi Connection
    try {
      updateTest("2. Wagmi Connection", { status: "running" });
      const start = Date.now();
      
      if (!isConnected) throw new Error("Wagmi not connected");
      if (!address) throw new Error("No address from wagmi");
      
      updateTest("2. Wagmi Connection", { 
        status: "success", 
        message: `Address: ${address.slice(0, 10)}...${address.slice(-6)}`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("2. Wagmi Connection", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 3: Wallet Client Availability
    try {
      updateTest("3. Wallet Client Availability", { status: "running" });
      const start = Date.now();
      
      if (!walletClient) throw new Error("WalletClient is null");
      if (!walletClient.account) throw new Error("WalletClient has no account");
      if (!walletClient.account.address) throw new Error("WalletClient account has no address");
      
      // Check if the wallet can sign (required for Inco attestedDecrypt)
      const canSign = typeof walletClient.signMessage === "function";
      if (!canSign) throw new Error("WalletClient cannot sign messages");
      
      updateTest("3. Wallet Client Availability", { 
        status: "success", 
        message: `Account: ${walletClient.account.address.slice(0, 10)}..., Chain: ${walletClient.chain?.id}`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("3. Wallet Client Availability", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 4: Chain Configuration
    try {
      updateTest("4. Chain Configuration", { status: "running" });
      const start = Date.now();
      
      if (!chainId) throw new Error("No chain ID");
      if (chainId !== 84532) throw new Error(`Expected Base Sepolia (84532), got ${chainId}`);
      
      const incoChainId = incoPublicClient.chain.id;
      if (incoChainId !== 84532) throw new Error(`Inco publicClient chain mismatch: ${incoChainId}`);
      
      updateTest("4. Chain Configuration", { 
        status: "success", 
        message: `Chain: Base Sepolia (${chainId})`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("4. Chain Configuration", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 5: Inco Config Loading
    try {
      updateTest("5. Inco Config Loading", { status: "running" });
      const start = Date.now();
      
      const config = await getConfig();
      if (!config) throw new Error("Config is null");
      if (!config.executorAddress) throw new Error("No executor address");
      
      updateTest("5. Inco Config Loading", { 
        status: "success", 
        message: `Executor: ${config.executorAddress.slice(0, 10)}...`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("5. Inco Config Loading", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 6: Inco Fee Fetching
    try {
      updateTest("6. Inco Fee Fetching", { status: "running" });
      const start = Date.now();
      
      const fee = await getFee();
      if (typeof fee !== "bigint") throw new Error("Fee is not a bigint");
      
      updateTest("6. Inco Fee Fetching", { 
        status: "success", 
        message: `Fee: ${formatUnits(fee, 18)} ETH`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("6. Inco Fee Fetching", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 7: Read Contract (cUSDC Handle)
    let handle: `0x${string}` | null = null;
    try {
      updateTest("7. Read Contract (cUSDC Handle)", { status: "running" });
      const start = Date.now();
      
      if (!wagmiPublicClient) throw new Error("Wagmi publicClient not available");
      if (!address) throw new Error("Address not available");
      
      handle = await wagmiPublicClient.readContract({
        address: CUSDC_MARKETPLACE_ADDRESS,
        abi: CUSDC_MARKETPLACE_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      }) as `0x${string}`;
      
      const isValid = isValidHandle(handle);
      
      updateTest("7. Read Contract (cUSDC Handle)", { 
        status: "success", 
        message: `Handle: ${handle.slice(0, 14)}..., Valid: ${isValid}`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("7. Read Contract (cUSDC Handle)", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 8: Encryption Test
    try {
      updateTest("8. Encryption Test", { status: "running" });
      const start = Date.now();
      
      const testValue = 1000000n; // 1 cUSDC
      const encrypted = await encryptValue({
        value: testValue,
        address: address as `0x${string}`,
        contractAddress: CUSDC_MARKETPLACE_ADDRESS,
      });
      
      if (!encrypted) throw new Error("Encryption returned null");
      if (!encrypted.startsWith("0x")) throw new Error("Encryption result is not hex");
      
      updateTest("8. Encryption Test", { 
        status: "success", 
        message: `Encrypted length: ${encrypted.length} chars`,
        duration: Date.now() - start 
      });
    } catch (err) {
      updateTest("8. Encryption Test", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    // Test 9: Decryption Compatibility (CRITICAL TEST)
    try {
      updateTest("9. Decryption Compatibility", { status: "running" });
      const start = Date.now();
      
      if (!handle || handle === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        updateTest("9. Decryption Compatibility", { 
          status: "success", 
          message: "No cUSDC balance to decrypt (handle is zero). Purchase some cUSDC first to test decryption.",
          duration: Date.now() - start 
        });
      } else {
        // This is the critical test - does Privy's walletClient work with Inco?
        console.log("[Test] Starting decryption with Privy walletClient...");
        console.log("[Test] WalletClient chain:", walletClient.chain?.name);
        console.log("[Test] WalletClient account:", walletClient.account?.address);
        
        const decrypted = await decryptValue({
          walletClient,
          handle,
          contractAddress: CUSDC_MARKETPLACE_ADDRESS,
        });
        
        updateTest("9. Decryption Compatibility", { 
          status: "success", 
          message: `Decrypted: ${formatUnits(decrypted, 6)} cUSDC`,
          duration: Date.now() - start 
        });
      }
    } catch (err) {
      console.error("[Test] Decryption failed:", err);
      updateTest("9. Decryption Compatibility", { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown error" 
      });
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#00f5ff] mb-2">Privy + Inco Compatibility Test</h1>
        <p className="text-gray-400 mb-8">Tests wallet integration and FHE decryption compatibility</p>

        {/* Status */}
        <div className="mb-8 p-4 border border-[#00f5ff]/20 bg-black/50">
          <h2 className="text-lg font-mono text-[#00f5ff] mb-4">Connection Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Privy Ready:</span>
              <span className={`ml-2 ${ready ? "text-green-400" : "text-red-400"}`}>
                {ready ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Authenticated:</span>
              <span className={`ml-2 ${authenticated ? "text-green-400" : "text-red-400"}`}>
                {authenticated ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Wagmi Connected:</span>
              <span className={`ml-2 ${isConnected ? "text-green-400" : "text-red-400"}`}>
                {isConnected ? "✓" : "✗"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Wallet Client:</span>
              <span className={`ml-2 ${walletClient ? "text-green-400" : walletLoading ? "text-yellow-400" : "text-red-400"}`}>
                {walletClient ? "✓" : walletLoading ? "Loading..." : "✗"}
              </span>
            </div>
          </div>
          {address && (
            <div className="mt-4 font-mono text-xs">
              <span className="text-gray-400">Address: </span>
              <span className="text-[#00f5ff]">{address}</span>
            </div>
          )}
          {wallets.length > 0 && (
            <div className="mt-2 font-mono text-xs">
              <span className="text-gray-400">Privy Wallets: </span>
              <span className="text-[#00f5ff]">{wallets.length} ({wallets[0]?.walletClientType})</span>
            </div>
          )}
        </div>

        {/* Run Tests Button */}
        <div className="mb-8">
          <button
            onClick={runAllTests}
            disabled={!authenticated || !walletClient || isRunning}
            className="px-6 py-3 bg-[#00f5ff]/10 border border-[#00f5ff] text-[#00f5ff] font-mono text-sm tracking-wider hover:bg-[#00f5ff]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isRunning ? "RUNNING TESTS..." : "RUN ALL TESTS"}
          </button>
          {!authenticated && (
            <p className="mt-2 text-yellow-400 text-sm">Please connect your wallet first</p>
          )}
        </div>

        {/* Test Results */}
        {tests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-mono text-[#00f5ff] mb-4">Test Results</h2>
            {tests.map((test) => (
              <div
                key={test.name}
                className={`p-4 border transition-all ${
                  test.status === "success"
                    ? "border-green-500/30 bg-green-500/5"
                    : test.status === "error"
                    ? "border-red-500/30 bg-red-500/5"
                    : test.status === "running"
                    ? "border-yellow-500/30 bg-yellow-500/5 animate-pulse"
                    : "border-gray-500/20 bg-gray-500/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {test.status === "success" ? "✅" : 
                       test.status === "error" ? "❌" : 
                       test.status === "running" ? "⏳" : "⬜"}
                    </span>
                    <span className="font-mono text-sm">{test.name}</span>
                  </div>
                  {test.duration && (
                    <span className="text-xs text-gray-400">{test.duration}ms</span>
                  )}
                </div>
                {test.message && (
                  <p className={`mt-2 text-xs font-mono pl-8 ${
                    test.status === "error" ? "text-red-400" : "text-gray-400"
                  }`}>
                    {test.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 p-4 border border-gray-700 bg-gray-900/50">
          <h3 className="text-sm font-mono text-gray-400 mb-2">Debug Info</h3>
          <pre className="text-xs text-gray-500 overflow-auto">
{JSON.stringify({
  privyReady: ready,
  authenticated,
  walletCount: wallets.length,
  walletType: wallets[0]?.walletClientType,
  wagmiConnected: isConnected,
  wagmiAddress: address,
  chainId,
  walletClientAvailable: !!walletClient,
  walletClientChain: walletClient?.chain?.id,
  walletClientAccount: walletClient?.account?.address,
}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
