"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { Hash } from "viem";
import { usePublicClient } from "wagmi";

import { describeError } from "@/lib/errors";

/** wallet: waiting for the user to confirm · mining: sent, waiting for a block. */
export type TxPhase = "idle" | "wallet" | "mining" | "done" | "error";

/**
 * Runs one transaction from wallet prompt to receipt, then refreshes every on-chain read so
 * the screen reflects the new state. Each component owns its own instance.
 */
export function useTransaction() {
  const client = usePublicClient();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<Hash | null>(null);

  const run = useCallback(
    async (send: () => Promise<Hash>): Promise<boolean> => {
      setError(null);
      setPhase("wallet");
      try {
        const sent = await send();
        setHash(sent);
        setPhase("mining");
        const receipt = await client!.waitForTransactionReceipt({ hash: sent });
        if (receipt.status !== "success") throw new Error("The transaction was reverted.");
        await queryClient.invalidateQueries();
        setPhase("done");
        return true;
      } catch (e) {
        setError(describeError(e));
        setPhase("error");
        return false;
      }
    },
    [client, queryClient],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setHash(null);
  }, []);

  return { run, reset, phase, error, hash, busy: phase === "wallet" || phase === "mining" };
}
