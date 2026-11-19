"use client";

import { useWriteContract } from "wagmi";

import { boardContract, tokenContract } from "@/lib/contracts";

import { useTransaction } from "./useTransaction";

/**
 * Every write the board supports, each tracked by its own transaction state. The contract handles
 * carry the chain id, so a wallet on the wrong network is asked to switch.
 * Revert reasons are decoded by viem against the ABI and turned into plain language.
 */
export function useBountyActions() {
  const { writeContractAsync } = useWriteContract();
  const tx = useTransaction();
  const board = <A extends Parameters<typeof writeContractAsync>[0]>(request: A) =>
    tx.run(() => writeContractAsync(request));

  return {
    ...tx,
    approveReward: (amount: bigint) =>
      board({ ...tokenContract, functionName: "approve", args: [boardContract.address, amount] }),
    createBounty: (reward: bigint, deadline: number, reviewWindow: number, briefURI: string) =>
      board({
        ...boardContract,
        functionName: "createBounty",
        args: [reward, deadline, reviewWindow, briefURI],
      }),
    claim: (id: bigint) => board({ ...boardContract, functionName: "claimBounty", args: [id] }),
    submit: (id: bigint, resultURI: string) =>
      board({ ...boardContract, functionName: "submitWork", args: [id, resultURI] }),
    approve: (id: bigint, rating: number) =>
      board({ ...boardContract, functionName: "approveWork", args: [id, rating] }),
    reject: (id: bigint) => board({ ...boardContract, functionName: "rejectWork", args: [id] }),
    release: (id: bigint) =>
      board({ ...boardContract, functionName: "releaseAfterTimeout", args: [id] }),
    cancel: (id: bigint) => board({ ...boardContract, functionName: "cancelBounty", args: [id] }),
  };
}
