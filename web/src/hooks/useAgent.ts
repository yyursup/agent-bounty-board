"use client";

import type { Address } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

import type { AgentRecord, PosterRecord } from "@/lib/bounty/types";
import { env } from "@/lib/config/env";
import { boardContract } from "@/lib/contracts";

export function useHasAgentId(address: Address | undefined) {
  const { data, isLoading } = useReadContract({
    ...boardContract,
    functionName: "hasAgentId",
    args: address ? [address] : undefined,
    query: { enabled: env.isConfigured && !!address },
  });
  return { hasAgentId: data ?? false, isLoading };
}

export function useAgentRecord(address: Address | undefined) {
  const { data, isLoading } = useReadContract({
    ...boardContract,
    functionName: "recordOf",
    args: address ? [address] : undefined,
    query: { enabled: env.isConfigured && !!address },
  });
  return { record: data as AgentRecord | undefined, isLoading };
}

export function usePosterRecord(address: Address | undefined) {
  const { data, isLoading } = useReadContract({
    ...boardContract,
    functionName: "posterRecordOf",
    args: address ? [address] : undefined,
    query: { enabled: env.isConfigured && !!address },
  });
  return { record: data as PosterRecord | undefined, isLoading };
}

/** The floors posters may choose today. The owner can move it; posted jobs keep their own. */
export function useFloorRange() {
  const { data } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...boardContract, functionName: "minFloorBps" },
      { ...boardContract, functionName: "maxFloorBps" },
    ],
    query: { enabled: env.isConfigured, staleTime: 5 * 60_000 },
  });
  return data ? { min: data[0], max: data[1] } : { min: 1_000, max: 5_000 };
}
