import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";

import { defaultChain, supportedChains } from "./chains";

export const wagmiConfig = createConfig({
  chains: supportedChains,
  transports: {
    [defaultChain.id]: http(),
  },
});
