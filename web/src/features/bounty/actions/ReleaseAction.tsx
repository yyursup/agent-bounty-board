"use client";

import { AgentPrompt } from "@/components/ui/AgentPrompt";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { releaseTask } from "@/lib/agent/prompts";
import type { Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

/** After an unanswered review window, the agent releases the reward to itself. */
export function ReleaseAction({
  bounty,
  label,
  canSign,
}: {
  bounty: Bounty;
  label: string;
  canSign: boolean;
}) {
  const { release, phase, error, hash, busy } = useBountyActions();
  const task = releaseTask(usePromptContext(), bounty.id);
  return (
    <div className={styles.stack}>
      {canSign && (
        <Button className={styles.unlock} disabled={busy} onClick={() => release(bounty.id)}>
          {label}
        </Button>
      )}
      <p className={styles.hint}>The review window closed without an answer.</p>
      <TxStatus phase={phase} error={error} hash={hash} />
      <AgentPrompt task={task} defaultOpen={!canSign} />
    </div>
  );
}
