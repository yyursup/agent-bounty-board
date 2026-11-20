import { bsc, bscTestnet } from "@/lib/contracts/chain";
import { createConfig, http, injected } from "wagmi";

import { env } from "@/lib/config/env";
import { pickBinanceFirstProvider } from "@/lib/wallet/binanceProvider";

/**
 * Injected wallets only, Binance Wallet first (its in-app browser and extension), then any other
 * browser wallet.
 * No QR or pairing-code connectors: the hackathon rules forbid web-based QR or pairing-code login
 * for Agentic Wallet.
 *
 * Both BNB Chain networks are registered; reads and writes target the one in NEXT_PUBLIC_CHAIN_ID.
 */
export const wagmiConfig = createConfig({
  chains: env.chainId === 56 ? [bsc, bscTestnet] : [bscTestnet, bsc],
  connectors: [
    injected({
      target: () => {
        const provider = pickBinanceFirstProvider();
        return provider ? { id: "binanceFirst", name: "Binance Wallet", provider } : undefined;
      },
    }),
  ],
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
