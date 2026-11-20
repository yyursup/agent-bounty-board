"use client";

import { useState } from "react";
import type { Address } from "viem";

import { AgentPrompt } from "@/components/ui/AgentPrompt";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { returnTask, signTask } from "@/lib/agent/prompts";
import { canReject } from "@/lib/bounty/lifecycle";
import type { Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

const RATINGS = [1, 2, 3, 4, 5] as const;

/** The sender signs for a delivery with a rating, or returns it while the window is open. */
export function SignAction({
  bounty,
  me,
  now,
  canSign,
  onOpen,
  onSigned,
}: {
  bounty: Bounty;
  me: Address;
  now: number;
  canSign: boolean;
  /** Called when the sender opens the rating sheet. */
  onOpen?: () => void;
  /** Lets the mailbag fly the rating stamp into the carrier's passport. */
  onSigned?: (rating: number, from: HTMLElement | null) => void;
}) {
  const sign = useBountyActions();
  const ret = useBountyActions();
  const ctx = usePromptContext();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [picked, setPicked] = useState<HTMLElement | null>(null);
  const returnable = canReject(bounty, me, now);

  if (!open) {
    return (
      <div className={styles.stack}>
        <div className={styles.row}>
          <Button
            size="lg"
            onClick={() => {
              setOpen(true);
              onOpen?.();
            }}
          >
            Sign for it
          </Button>
          {returnable && canSign && (
            <Button
              size="lg"
              variant="outline"
              disabled={ret.busy}
              onClick={() => ret.reject(bounty.id)}
            >
              Return to sender
            </Button>
          )}
        </div>
        <TxStatus phase={ret.phase} error={ret.error} hash={ret.hash} />
        {returnable && (
          <AgentPrompt task={returnTask(ctx, bounty.id)} label="Return it with Binance AI Pro" />
        )}
      </div>
    );
  }

  return (
    <div className={styles.sheet}>
      <span className={styles.label}>Stamp a rating in their passport</span>
      <div role="radiogroup" aria-label="Rating" className={styles.ratings}>
        {RATINGS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === rating}
            className={styles.rating}
            onClick={(e) => {
              setRating(n);
              setPicked(e.currentTarget);
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <p className={styles.hint}>Pays the agent and records {rating}/5.</p>
      <div className={styles.row}>
        {canSign && (
          <Button
            disabled={sign.busy}
            onClick={async () => {
              if (await sign.approve(bounty.id, rating)) onSigned?.(rating, picked);
            }}
          >
            Sign and pay
          </Button>
        )}
        <Button variant="outline" disabled={sign.busy} onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
      <TxStatus phase={sign.phase} error={sign.error} hash={sign.hash} />
      <AgentPrompt task={signTask(ctx, bounty.id, rating)} defaultOpen={!canSign} />
    </div>
  );
}
