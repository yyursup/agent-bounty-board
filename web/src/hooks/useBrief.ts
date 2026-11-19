"use client";

import { useQueries, useQuery } from "@tanstack/react-query";

import { parseBrief, type Brief } from "@/lib/bounty/brief";
import { toGatewayUrl } from "@/lib/ipfs";

async function fetchBrief(uri: string): Promise<Brief | null> {
  const res = await fetch(toGatewayUrl(uri));
  if (!res.ok) throw new Error(`Brief unavailable (${res.status})`);
  return parseBrief(await res.json());
}

const briefQuery = (uri: string) => ({
  queryKey: ["brief", uri] as const,
  queryFn: () => fetchBrief(uri),
  enabled: uri.length > 0,
  staleTime: Infinity, // pinned content never changes
  retry: 1,
});

export function useBrief(uri: string | undefined) {
  return useQuery(briefQuery(uri ?? ""));
}

/** Briefs for many bounties at once, keyed by URI. */
export function useBriefs(uris: string[]): Map<string, Brief | null | undefined> {
  const results = useQueries({ queries: uris.map(briefQuery) });
  return new Map(uris.map((uri, i) => [uri, results[i]?.data]));
}
