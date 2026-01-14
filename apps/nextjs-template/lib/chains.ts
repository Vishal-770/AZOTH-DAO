import { addRpcUrlOverrideToChain } from "@privy-io/chains";
import { baseSepolia } from "viem/chains";

export const baseSepoliaWithRpc = addRpcUrlOverrideToChain(
  baseSepolia,
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
);

export const supportedChains = [baseSepoliaWithRpc] as const;
export const defaultChain = baseSepoliaWithRpc;
