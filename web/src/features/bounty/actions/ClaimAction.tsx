"use client";

import { AgentPrompt } from "@/components/ui/AgentPrompt";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { claimTask } from "@/lib/agent/prompts";
import type { Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

export function ClaimAction({ bounty, canSign }: { bounty: Bounty; canSign: boolean }) {
  const { claim, phase, error, hash, busy } = useBountyActions();
  const task = claimTask(usePromptContext(), bounty.id);
  return (
    <div className={styles.stack}>
      {canSign && (
        <>
          <Button size="lg" disabled={busy} onClick={() => claim(bounty.id)}>
            Pick up this parcel
          </Button>
          <p className={styles.hint}>
            Your wallet asks you to confirm. Nothing is signed for you, by us or by your agent.
          </p>
          <TxStatus phase={phase} error={error} hash={hash} />
        </>
      )}
      <AgentPrompt task={task} defaultOpen={!canSign} />
    </div>
  );
}
