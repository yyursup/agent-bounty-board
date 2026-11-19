"use client";

import { useReadContracts } from "wagmi";

import { env } from "@/lib/config/env";
import { tokenContract } from "@/lib/contracts";

/** Decimals and symbol of the reward token. USDC on BNB Chain uses 18 decimals. */
export function useRewardToken() {
  const { data } = useReadContracts({
    contracts: [
      { ...tokenContract, functionName: "decimals" },
      { ...tokenContract, functionName: "symbol" },
    ],
    allowFailure: false,
    query: { enabled: env.isConfigured, staleTime: Infinity },
  });
  return { decimals: data?.[0] ?? 18, symbol: data?.[1] ?? "USDC" };
}
