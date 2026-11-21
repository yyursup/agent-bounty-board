"use client";

import type { PromptContext } from "@/lib/agent/prompts";
import { env } from "@/lib/config/env";
import { activeChain } from "@/lib/contracts";
import { useIdentity } from "@/lib/wallet/identity";

import { useRewardToken } from "./useRewardToken";

/**
 * Everything a prompt needs to name the right chain, contracts and wallet. The wallet line goes in
 * only for an address the visitor typed with "View by address": a connected browser wallet is not
 * the Agentic Wallet that Binance AI Pro acts from, so naming it would make the agent stop.
 */
export function usePromptContext(): PromptContext {
  const { decimals, symbol } = useRewardToken();
  const { address, mode } = useIdentity();
  return {
    chainId: activeChain.id,
    chainName: activeChain.name,
    board: env.boardAddress,
    token: env.rewardTokenAddress,
    decimals,
    symbol,
    wallet: mode === "viewing" ? address : undefined,
  };
}
