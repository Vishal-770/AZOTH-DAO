"use client";

import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { defaultChain, supportedChains } from "@/lib/chains";
import { wagmiConfig } from "@/lib/wagmi-config";

const queryClient = new QueryClient();

interface PrivyProviderProps {
  children: React.ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

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
          logo: "/logo.svg",
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
        supportedChains: [...supportedChains],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </Privy>
  );
}
