import { getAddress, isAddress, zeroAddress, type Address } from "viem";

/**
 * Public runtime configuration. Each variable is read with a literal `process.env.NEXT_PUBLIC_*`
 * so Next.js can inline it at build time.
 */

function toAddress(value: string | undefined): Address {
  return value && isAddress(value) ? getAddress(value) : zeroAddress;
}

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "97");
const boardAddress = toAddress(process.env.NEXT_PUBLIC_BOUNTY_BOARD_ADDRESS);
const rewardTokenAddress = toAddress(process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS);

export const env = {
  chainId: chainId === 56 ? 56 : 97,
  boardAddress,
  rewardTokenAddress,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || undefined,
  ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/",
  /** False until the deploy addresses are filled in; the UI shows a notice instead of failing calls. */
  isConfigured: boardAddress !== zeroAddress && rewardTokenAddress !== zeroAddress,
} as const;
