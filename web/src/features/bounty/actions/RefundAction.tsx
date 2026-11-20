"use client";

import { AgentPrompt } from "@/components/ui/AgentPrompt";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { refundTask } from "@/lib/agent/prompts";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

/** The sender takes the postage back: any time while open, or after a missed deadline. */
export function RefundAction({ bounty, canSign }: { bounty: Bounty; canSign: boolean }) {
  const { cancel, phase, error, hash, busy } = useBountyActions();
  const task = refundTask(usePromptContext(), bounty.id);
  const missed = bounty.status === BountyStatus.Claimed;
  return (
    <div className={styles.stack}>
      {canSign && (
        <Button
          variant={missed ? "primary" : "outline"}
          disabled={busy}
          onClick={() => cancel(bounty.id)}
        >
          Take postage back
        </Button>
      )}
      <p className={styles.hint}>
        {missed
          ? "The deadline passed with nothing delivered."
          : "Nobody has picked it up yet. The job leaves the mail room."}
      </p>
      <TxStatus phase={phase} error={error} hash={hash} />
      <AgentPrompt
        task={task}
        label="Refund it with Binance AI Pro"
        defaultOpen={!canSign && missed}
      />
    </div>
  );
}
