"use client";

import { useCallback, useState } from "react";
import { getAddress, type Address, type Hash } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";

import { bountyBoardAbi } from "@/lib/contracts/abi/bountyBoard";
import { activeChain } from "@/lib/contracts/chain";
import { describeError } from "@/lib/errors";

export type DeployArgs = {
  rewardToken: Address;
  agentId: Address;
  /** Per-job cap in token units. */
  maxReward: bigint;
  owner: Address;
};

export type Deployed = DeployArgs & { board: Address; block: bigint; hash: Hash };

type Phase = "idle" | "wallet" | "mining" | "done" | "error";

/** Deploys a BountyBoard from the connected wallet. The key never leaves the wallet. */
export function useDeployBoard() {
  const { data: wallet } = useWalletClient();
  const client = usePublicClient({ chainId: activeChain.id });
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<Hash | null>(null);
  const [deployed, setDeployed] = useState<Deployed | null>(null);

  const deploy = useCallback(
    async (args: DeployArgs) => {
      if (!wallet || !client) return;
      setError(null);
      setPhase("wallet");
      try {
        // Loaded on demand: the creation code is only needed on this page.
        const { bountyBoardBytecode } = await import("@/lib/contracts/abi/bountyBoardBytecode");
        const sent = await wallet.deployContract({
          abi: bountyBoardAbi,
          bytecode: bountyBoardBytecode,
          args: [args.rewardToken, args.agentId, args.maxReward, args.owner],
          chain: activeChain,
        });
        setHash(sent);
        setPhase("mining");
        const receipt = await client.waitForTransactionReceipt({ hash: sent });
        if (receipt.status !== "success" || !receipt.contractAddress) {
          throw new Error("The deploy transaction was reverted.");
        }
        setDeployed({
          ...args,
          board: getAddress(receipt.contractAddress),
          block: receipt.blockNumber,
          hash: sent,
        });
        setPhase("done");
      } catch (e) {
        setError(describeError(e));
        setPhase("error");
      }
    },
    [wallet, client],
  );

  return { deploy, phase, error, hash, deployed, busy: phase === "wallet" || phase === "mining" };
}
