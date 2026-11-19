import { defineChain } from "viem";

import { env } from "@/lib/config/env";

/**
 * The two BNB Chain networks, declared here rather than imported from viem's chain barrel, which
 * pulls every chain viem knows into the bundle.
 */
export const bsc = defineChain({
  id: 56,
  name: "BNB Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://bsc-dataseed.bnbchain.org"] } },
  blockExplorers: { default: { name: "BscScan", url: "https://bscscan.com" } },
  contracts: {
    multicall3: { address: "0xca11bde05977b3631167028862be2a173976ca11", blockCreated: 15921452 },
  },
});

export const bscTestnet = defineChain({
  id: 97,
  name: "BSC Testnet",
  nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
  rpcUrls: { default: { http: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"] } },
  blockExplorers: { default: { name: "BscScan", url: "https://testnet.bscscan.com" } },
  contracts: {
    multicall3: { address: "0xca11bde05977b3631167028862be2a173976ca11", blockCreated: 17422483 },
  },
  testnet: true,
});

export const activeChain = env.chainId === 56 ? bsc : bscTestnet;

export function explorerTxUrl(hash: string): string {
  return `${activeChain.blockExplorers.default.url}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${activeChain.blockExplorers.default.url}/address/${address}`;
}
