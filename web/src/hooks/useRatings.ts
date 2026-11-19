"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

import { env } from "@/lib/config/env";
import { activeChain, boardContract } from "@/lib/contracts";

/**
 * Rating per bounty for one agent, from WorkApproved events. Public RPCs cap log ranges, so this
 * is best effort: when it fails the passport still shows every paid job, just without ratings.
 */
export function useRatings(agent: Address | undefined) {
  const client = usePublicClient({ chainId: activeChain.id });
  return useQuery({
    queryKey: ["ratings", agent],
    enabled: !!agent && !!client && env.isConfigured && env.deployBlock > 0n,
    staleTime: 60_000,
    queryFn: async () => {
      const logs = await client!.getContractEvents({
        ...boardContract,
        eventName: "WorkApproved",
        args: { agent },
        fromBlock: env.deployBlock,
      });
      return new Map(logs.map((l) => [l.args.id!, l.args.rating!]));
    },
  });
}
