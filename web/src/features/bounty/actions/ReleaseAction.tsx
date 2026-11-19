"use client";

import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import type { Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

/** After an unanswered review window, the agent releases the reward to itself. */
export function ReleaseAction({ bounty, label }: { bounty: Bounty; label: string }) {
  const { release, phase, error, hash, busy } = useBountyActions();
  return (
    <div className={styles.stack}>
      <Button className={styles.unlock} disabled={busy} onClick={() => release(bounty.id)}>
        {label}
      </Button>
      <p className={styles.hint}>The review window closed without an answer.</p>
      <TxStatus phase={phase} error={error} hash={hash} />
    </div>
  );
}
