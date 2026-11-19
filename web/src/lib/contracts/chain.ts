import { bsc, bscTestnet } from "viem/chains";

import { env } from "@/lib/config/env";

export const activeChain = env.chainId === 56 ? bsc : bscTestnet;

export function explorerTxUrl(hash: string): string {
  return `${activeChain.blockExplorers.default.url}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${activeChain.blockExplorers.default.url}/address/${address}`;
}
