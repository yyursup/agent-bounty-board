"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";

import type { AgentRecord } from "@/lib/bounty/types";
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
