"use client";

import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

import { defaultChain, supportedChains } from "@/lib/chains";
import { wagmiConfig } from "@/lib/wagmi-config";

const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  // Memoize queryClient to avoid recreating on every render
  const queryClient = useMemo(() => new QueryClient(), []);
  
  // Memoize the chains array to avoid the React key warning
  const chains = useMemo(() => [...supportedChains], []);

  if (!appId) {
    console.warn("NEXT_PUBLIC_PRIVY_APP_ID is not set. Wallet connection is disabled.");
    return <>{children}</>;
  }

  return (
    <Privy
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00f5ff",
          logo: "/dao-logo.png",
          landingHeader: "Connect to Azoth Protocol",
          loginMessage: "Privacy-preserving DAO governance powered by FHE",
        },
        loginMethods: ["wallet", "email", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain,
        supportedChains: chains,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </Privy>
  );
};

export default WalletProvider;
