"use client";

import { Button } from "@/components/ui/Button";
import { TwoWays } from "@/components/ui/TwoWays";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { claimTask } from "@/lib/agent/prompts";
import type { Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

export function ClaimAction({ bounty, canSign }: { bounty: Bounty; canSign: boolean }) {
  const { claim, phase, error, hash, busy } = useBountyActions();
  return (
    <TwoWays
      canSign={canSign}
      task={claimTask(usePromptContext(), bounty.id)}
      manual={
        <div className={styles.stack}>
          <Button size="lg" disabled={busy} onClick={() => claim(bounty.id)}>
            Pick up this parcel
          </Button>
          <p className={styles.hint}>Your wallet asks you to confirm. Nothing is signed for you.</p>
          <TxStatus phase={phase} error={error} hash={hash} />
        </div>
      }
    />
  );
}
