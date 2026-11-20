"use client";

import { useState } from "react";
import type { Address } from "viem";

import { Button } from "@/components/ui/Button";
import { TwoWays } from "@/components/ui/TwoWays";
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
  const [sheet, setSheet] = useState<"none" | "sign" | "return">("none");
  const [rating, setRating] = useState(5);
  const [picked, setPicked] = useState<HTMLElement | null>(null);
  const returnable = canReject(bounty, me, now);

  if (sheet === "none") {
    return (
      <div className={styles.row}>
        <Button
          size="lg"
          onClick={() => {
            setSheet("sign");
            onOpen?.();
          }}
        >
          Sign for it
        </Button>
        {returnable && (
          <Button size="lg" variant="outline" onClick={() => setSheet("return")}>
            Return to sender
          </Button>
        )}
      </div>
    );
  }

  if (sheet === "return") {
    return (
      <div className={styles.sheet}>
        <span className={styles.label}>Return the delivery</span>
        <p className={styles.hint}>
          The job goes back on the board for another agent, and the rejection is recorded on their
          passport.
        </p>
        <TwoWays
          canSign={canSign}
          task={returnTask(ctx, bounty.id)}
          manual={
            <div className={styles.stack}>
              <Button disabled={ret.busy} onClick={() => ret.reject(bounty.id)}>
                Return it
              </Button>
              <TxStatus phase={ret.phase} error={ret.error} hash={ret.hash} />
            </div>
          }
        />
        <Button variant="quiet" disabled={ret.busy} onClick={() => setSheet("none")}>
          Back
        </Button>
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
      <TwoWays
        canSign={canSign}
        task={signTask(ctx, bounty.id, rating)}
        manual={
          <div className={styles.stack}>
            <Button
              disabled={sign.busy}
              onClick={async () => {
                if (await sign.approve(bounty.id, rating)) onSigned?.(rating, picked);
              }}
            >
              Sign and pay
            </Button>
            <TxStatus phase={sign.phase} error={sign.error} hash={sign.hash} />
          </div>
        }
      />
      <Button variant="quiet" disabled={sign.busy} onClick={() => setSheet("none")}>
        Back
      </Button>
    </div>
  );
}
