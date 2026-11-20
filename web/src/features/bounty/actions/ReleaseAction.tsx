"use client";

import { Button } from "@/components/ui/Button";
import { TwoWays } from "@/components/ui/TwoWays";
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
  return (
    <div className={styles.stack}>
      <p className={styles.hint}>The review window closed without an answer.</p>
      <TwoWays
        canSign={canSign}
        task={releaseTask(usePromptContext(), bounty.id)}
        manual={
          <div className={styles.stack}>
            <Button className={styles.unlock} disabled={busy} onClick={() => release(bounty.id)}>
              {label}
            </Button>
            <TxStatus phase={phase} error={error} hash={hash} />
          </div>
        }
      />
    </div>
  );
}
