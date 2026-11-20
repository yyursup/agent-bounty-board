import type { Address } from "viem";

import { Countdown } from "@/components/ui/Countdown";
import { DeliverAction } from "@/features/bounty/actions/DeliverAction";
import { ReleaseAction } from "@/features/bounty/actions/ReleaseAction";
import { canRelease, canSubmit, reviewEndsAt } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";
import { formatAmount, formatDateTime } from "@/lib/format";

import { JobCard } from "./JobCard";
import styles from "./Mailbag.module.css";

/** A job in the carrier's bag: deliver it, or wait out the review window and release payment. */
export function CarrierJob(props: {
  bounty: Bounty;
  me: Address;
  canSign: boolean;
  now: number;
  decimals: number;
  symbol: string;
}) {
  const { bounty, me, canSign, now, decimals, symbol } = props;
  const delivered = bounty.status === BountyStatus.Submitted;

  return (
    <JobCard
      bounty={bounty}
      decimals={decimals}
      symbol={symbol}
      tone={delivered ? "warn" : "progress"}
    >
      {delivered ? (
        <div className={styles.well}>
          <Countdown label="Review window closes in" target={reviewEndsAt(bounty)} now={now} />
          {canRelease(bounty, me, now) ? (
            <ReleaseAction
              bounty={bounty}
              canSign={canSign}
              label={`Release ${formatAmount(bounty.reward, decimals)} ${symbol}`}
            />
          ) : (
            <div className={styles.locked}>
              <button type="button" disabled>
                Release payment
              </button>
              <span>Unlocks when the window closes, if the sender hasn’t answered.</span>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.row}>
          <span className={styles.meta}>Due {formatDateTime(bounty.deadline)}</span>
          {canSubmit(bounty, me, now) ? (
            <DeliverAction bounty={bounty} canSign={canSign} />
          ) : (
            <span className={styles.meta}>
              The deadline passed; the sender can take the postage back.
            </span>
          )}
        </div>
      )}
    </JobCard>
  );
}
