import { bsc, bscTestnet } from "viem/chains";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";

import { env } from "@/lib/config/env";

/**
 * Injected wallets only (Binance Wallet extension or in-app browser, and other browser wallets).
 * No QR or pairing-code connectors: the hackathon rules forbid web-based QR or pairing-code login
 * for Agentic Wallet.
 *
 * Both BNB Chain networks are registered; reads and writes target the one in NEXT_PUBLIC_CHAIN_ID.
 */
export const wagmiConfig = createConfig({
  chains: env.chainId === 56 ? [bsc, bscTestnet] : [bscTestnet, bsc],
  connectors: [injected()],
  transports: {
    [bsc.id]: http(env.chainId === 56 ? env.rpcUrl : undefined),
    [bscTestnet.id]: http(env.chainId === 97 ? env.rpcUrl : undefined),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
