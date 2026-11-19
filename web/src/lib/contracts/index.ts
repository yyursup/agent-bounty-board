import { erc20Abi } from "viem";

import { env } from "@/lib/config/env";
import { bountyBoardAbi } from "./abi/bountyBoard";
import { activeChain } from "./chain";

/**
 * The BountyBoard contract, ready to spread into wagmi read/write calls. The chain id pins every
 * call to the configured network, whatever network the wallet happens to be on.
 */
export const boardContract = {
  address: env.boardAddress,
  abi: bountyBoardAbi,
  chainId: activeChain.id,
} as const;

/** The reward token (USDC). */
export const tokenContract = {
  address: env.rewardTokenAddress,
  abi: erc20Abi,
  chainId: activeChain.id,
} as const;

export { bountyBoardAbi };
export { activeChain, explorerAddressUrl, explorerTxUrl } from "./chain";
