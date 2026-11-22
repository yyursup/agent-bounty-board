"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TwoWays } from "@/components/ui/TwoWays";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { refundTask } from "@/lib/agent/prompts";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

/** The sender takes the postage back: any time while open, or after a missed deadline. */
export function RefundAction({ bounty, canSign }: { bounty: Bounty; canSign: boolean }) {
  const { cancel, phase, error, hash, busy } = useBountyActions();
  const ctx = usePromptContext();
  const missed = bounty.status === BountyStatus.Claimed;
  const [open, setOpen] = useState(missed);
  const free = bounty.reward === 0n;
  const label = free ? "Withdraw the job" : "Take postage back";

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className={styles.sheet}>
      <p className={styles.hint}>
        {free
          ? missed
            ? "The deadline passed with nothing delivered. Close the job."
            : "Nobody has picked it up yet. The job leaves the mail room."
          : missed
            ? "The deadline passed with nothing delivered. Take the reward back."
            : "Nobody has picked it up yet. The job leaves the mail room and the reward comes back."}
      </p>
      <TwoWays
        canSign={canSign}
        task={refundTask(ctx, bounty.id)}
        manual={
          <div className={styles.stack}>
            <Button disabled={busy} onClick={() => cancel(bounty.id)}>
              {label}
            </Button>
            <TxStatus phase={phase} error={error} hash={hash} />
          </div>
        }
      />
      {!missed && (
        <Button variant="quiet" disabled={busy} onClick={() => setOpen(false)}>
          Back
        </Button>
      )}
    </div>
  );
}
