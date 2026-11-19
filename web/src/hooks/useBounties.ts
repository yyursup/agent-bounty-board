"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";

import { toBounty, type Bounty } from "@/lib/bounty/types";
import { env } from "@/lib/config/env";
import { boardContract } from "@/lib/contracts";

/** How many of the newest bounties the board loads. Enough for the hackathon; paginate later. */
const PAGE = 60;

/** The newest bounties, newest first. */
export function useBounties() {
  const count = useReadContract({
    ...boardContract,
    functionName: "bountyCount",
    query: { enabled: env.isConfigured },
  });

  const ids = useMemo(() => {
    const n = Number(count.data ?? 0n);
    return Array.from({ length: Math.min(n, PAGE) }, (_, i) => BigInt(n - i));
  }, [count.data]);

  const reads = useReadContracts({
    contracts: ids.map((id) => ({ ...boardContract, functionName: "getBounty", args: [id] }) as const),
    allowFailure: false,
    query: { enabled: ids.length > 0 },
  });

  const bounties = useMemo<Bounty[]>(
    () => reads.data?.map((raw, i) => toBounty(ids[i]!, raw)) ?? [],
    [reads.data, ids],
  );

  return {
    bounties,
    isLoading: count.isLoading || (ids.length > 0 && reads.isLoading),
    error: count.error ?? reads.error,
  };
}

/** One bounty by id. */
export function useBounty(id: bigint | undefined) {
  const read = useReadContract({
    ...boardContract,
    functionName: "getBounty",
    args: id === undefined ? undefined : [id],
    query: { enabled: env.isConfigured && id !== undefined },
  });
  const bounty = useMemo(
    () => (read.data && id !== undefined ? toBounty(id, read.data) : undefined),
    [read.data, id],
  );
  return { bounty, isLoading: read.isLoading, error: read.error };
}
