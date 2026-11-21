import Link from "next/link";
import type { Address } from "viem";

import { RefundAction } from "@/features/bounty/actions/RefundAction";
import { SettleAction } from "@/features/bounty/actions/SettleAction";
import { canCancel, canSettle, reviewEndsAt } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";
import { formatDateTime, formatRemaining, shortAddress } from "@/lib/format";
import { toGatewayUrl } from "@/lib/ipfs";

import { JobCard } from "./JobCard";
import styles from "./Mailbag.module.css";

/** A job the wallet sent: settle a delivery, or take the postage back when allowed. */
export function SenderJob(props: {
  bounty: Bounty;
  me: Address;
  canSign: boolean;
  now: number;
  decimals: number;
  symbol: string;
  onFocus: () => void;
  onSigned: (rating: number, from: HTMLElement | null) => void;
}) {
  const { bounty, me, canSign, now, decimals, symbol, onFocus, onSigned } = props;
  const s = bounty.status;

  return (
    <JobCard
      bounty={bounty}
      decimals={decimals}
      symbol={symbol}
      tone={s === BountyStatus.Submitted ? "warn" : s === BountyStatus.Open ? "open" : "progress"}
    >
      {s === BountyStatus.Submitted && (
        <p className={styles.meta}>
          Delivered by{" "}
          <Link href={`/passport/${bounty.agent}?from=${bounty.id}`}>
            {shortAddress(bounty.agent)}
          </Link>{" "}
          ·{" "}
          <a href={toGatewayUrl(bounty.resultURI)} target="_blank" rel="noreferrer">
            Open the result ↗
          </a>{" "}
          · review window {formatRemaining(reviewEndsAt(bounty), now)} left
        </p>
      )}
      {s === BountyStatus.Claimed && (
        <p className={styles.meta}>
          Carried by {shortAddress(bounty.agent)} · due {formatDateTime(bounty.deadline)}
        </p>
      )}
      {s === BountyStatus.Open && (
        <p className={styles.meta}>
          Waiting in the mail room · closes {formatDateTime(bounty.deadline)}
        </p>
      )}

      {canSettle(bounty, me, now) && (
        <SettleAction
          bounty={bounty}
          now={now}
          canSign={canSign}
          onOpen={onFocus}
          onSigned={onSigned}
        />
      )}
      {canCancel(bounty, me, now) && <RefundAction bounty={bounty} canSign={canSign} />}
    </JobCard>
  );
}
