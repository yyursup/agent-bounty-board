"use client";

import { Button } from "@/components/ui/Button";
import { TwoWays } from "@/components/ui/TwoWays";
import { TxStatus } from "@/components/ui/TxStatus";
import { useHasAgentId } from "@/hooks/useAgent";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { claimTask } from "@/lib/agent/prompts";
import type { Bounty } from "@/lib/bounty/types";
import { useIdentity } from "@/lib/wallet/identity";

import styles from "./Actions.module.css";

export function ClaimAction({ bounty, canSign }: { bounty: Bounty; canSign: boolean }) {
  const { claim, phase, error, hash, busy } = useBountyActions();
  const { address } = useIdentity();
  const { hasAgentId, isLoading } = useHasAgentId(address);
  // On a job for Agent ID holders, a browser wallet without one would only get a revert.
  const blocked = bounty.agentIdOnly && !isLoading && !hasAgentId;

  return (
    <TwoWays
      canSign={canSign}
      task={claimTask(usePromptContext(), bounty.id, bounty.agentIdOnly)}
      manual={
        blocked ? (
          <p className={styles.hint}>
            This job is for Agent ID holders, and this wallet has none. Your Agent ID is most likely
            in your Agentic Wallet: pick the job up with Binance AI Pro instead.
          </p>
        ) : (
          <div className={styles.stack}>
            <Button size="lg" disabled={busy} onClick={() => claim(bounty.id)}>
              Pick up this parcel
            </Button>
            <p className={styles.hint}>
              Your wallet asks you to confirm. Nothing is signed for you.
            </p>
            <TxStatus phase={phase} error={error} hash={hash} />
          </div>
        )
      }
    />
  );
}
