"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TwoWays } from "@/components/ui/TwoWays";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { useBrief } from "@/hooks/useBrief";
import { usePromptContext } from "@/hooks/usePromptContext";
import { useRewardToken } from "@/hooks/useRewardToken";
import { settleTask } from "@/lib/agent/prompts";
import { payoutTiers, ratingForPayout, reviewEndsAt } from "@/lib/bounty/lifecycle";
import { splitReward, type Bounty } from "@/lib/bounty/types";
import { formatAmount, formatRemaining } from "@/lib/format";
import { toGatewayUrl } from "@/lib/ipfs";

import styles from "./Actions.module.css";

const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * The sender settles a delivery: a share of the reward, never below the floor promised when the
 * job was posted, goes to the agent and the rest comes back. The main way is to have Binance AI
 * Pro review the work against the brief and propose the share; a browser wallet can settle directly.
 */
export function SettleAction({
  bounty,
  now,
  canSign,
  onOpen,
  onSigned,
}: {
  bounty: Bounty;
  now: number;
  canSign: boolean;
  /** Called when the sender opens the settle sheet. */
  onOpen?: () => void;
  /** Lets the mailbag fly the rating stamp into the carrier's passport. */
  onSigned?: (rating: number, from: HTMLElement | null) => void;
}) {
  const ctx = usePromptContext();
  const { decimals, symbol } = useRewardToken();
  const { data: brief, isLoading } = useBrief(bounty.briefURI);
  const tx = useBountyActions();
  const tiers = payoutTiers(bounty.floorBps);
  const [open, setOpen] = useState(false);
  const [paidBps, setPaidBps] = useState(tiers[tiers.length - 1]!);
  const [rating, setRating] = useState(5);
  const [picked, setPicked] = useState<HTMLElement | null>(null);
  const ends = reviewEndsAt(bounty);
  const money = (v: bigint) => `${formatAmount(v, decimals)} ${symbol}`;

  if (!open) {
    return (
      <div className={styles.stack}>
        <Button
          size="lg"
          onClick={() => {
            setOpen(true);
            onOpen?.();
          }}
        >
          Review and settle
        </Button>
        <p className={styles.hint}>
          {formatRemaining(ends, now)} left to settle. If the window closes unanswered, the agent
          can release the full reward.
        </p>
      </div>
    );
  }

  const task = isLoading
    ? null
    : settleTask(
        ctx,
        { id: bounty.id, reward: bounty.reward, floorBps: bounty.floorBps, reviewEndsAt: ends },
        {
          title: brief?.title ?? `Job #${bounty.id}`,
          briefUrl: toGatewayUrl(bounty.briefURI),
          resultUrl: toGatewayUrl(bounty.resultURI),
          criteria: brief?.criteria ?? [],
        },
      );
  const split = splitReward(bounty.reward, paidBps);

  return (
    <div className={styles.sheet}>
      <span className={styles.label}>Settle the delivery</span>
      <p className={styles.hint}>
        {bounty.floorBps > 0
          ? `You promised at least ${bounty.floorBps / 100}% when you posted this job, so the agent gets that much whatever the grade. The rest is yours to award.`
          : "This job was open to any wallet, so it has no floor: you can award anything from 0% up."}
      </p>
      <TwoWays
        canSign={canSign}
        task={task}
        agentPending={<p className={styles.hint}>Reading the brief…</p>}
        manual={
          <div className={styles.stack}>
            <div role="radiogroup" aria-label="Share to pay" className={styles.tiers}>
              {tiers.map((t) => {
                const s = splitReward(bounty.reward, t);
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={t === paidBps}
                    className={styles.tier}
                    onClick={() => {
                      setPaidBps(t);
                      setRating(ratingForPayout(t));
                    }}
                  >
                    <strong>{t / 100}%</strong>
                    <span>{money(s.toAgent)}</span>
                  </button>
                );
              })}
            </div>
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
            <p className={styles.hint}>
              The agent gets {money(split.toAgent)}, {money(split.toPoster)} comes back to you, and
              the job closes.
            </p>
            <Button
              disabled={tx.busy}
              onClick={async () => {
                if (await tx.settle(bounty.id, paidBps, rating)) onSigned?.(rating, picked);
              }}
            >
              Settle and pay {paidBps / 100}%
            </Button>
            <TxStatus phase={tx.phase} error={tx.error} hash={tx.hash} />
          </div>
        }
      />
      <Button variant="quiet" disabled={tx.busy} onClick={() => setOpen(false)}>
        Back
      </Button>
    </div>
  );
}
