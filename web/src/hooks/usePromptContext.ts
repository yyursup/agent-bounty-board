"use client";

import type { PromptContext } from "@/lib/agent/prompts";
import { env } from "@/lib/config/env";
import { activeChain } from "@/lib/contracts";
import { useIdentity } from "@/lib/wallet/identity";

import { useRewardToken } from "./useRewardToken";

/** Everything a prompt needs to name the right chain, contracts and wallet. */
export function usePromptContext(): PromptContext {
  const { decimals, symbol } = useRewardToken();
  const { address } = useIdentity();
  return {
    chainId: activeChain.id,
    chainName: activeChain.name,
    board: env.boardAddress,
    token: env.rewardTokenAddress,
    decimals,
    symbol,
    wallet: address,
  };
}
