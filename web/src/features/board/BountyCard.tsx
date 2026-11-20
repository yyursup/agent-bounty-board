import Link from "next/link";

import { Postmark } from "@/components/ui/Postmark";
import { Stamp } from "@/components/ui/Stamp";
import { Tag } from "@/components/ui/Tag";
import type { Brief } from "@/lib/bounty/brief";
import { STATUS_LABEL } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";
import { formatRemaining, shortAddress, splitAmount } from "@/lib/format";

import styles from "./MailRoom.module.css";

/** One job in the mail room: its stamp, a postmark once it has moved on, and when it closes. */
export function BountyCard({
  bounty,
  brief,
  decimals,
  now,
}: {
  bounty: Bounty;
  brief: Brief | null | undefined;
  decimals: number;
  now: number;
}) {
  const open = bounty.status === BountyStatus.Open;
  const when = open
    ? `Closes in ${formatRemaining(bounty.deadline, now)}`
    : bounty.status === BountyStatus.Claimed
      ? `Due in ${formatRemaining(bounty.deadline, now)}`
      : STATUS_LABEL[bounty.status];

  return (
    <Link href={`/bounty/${bounty.id}`} className={`${styles.card} stamp-hover`}>
      <Stamp
        className={styles.cardStamp}
        category={brief?.category ?? "Writing"}
        kicker={`#${String(bounty.id).padStart(4, "0")} · ${(brief?.category ?? "…").toUpperCase()}`}
        title={brief?.title ?? (brief === null ? "Brief unavailable" : "Loading brief…")}
        amount={splitAmount(bounty.reward, decimals)}
      />
      {bounty.status === BountyStatus.Claimed && (
        <Postmark className={styles.cardMark} top="BNB CHAIN" middle="PICKED UP" />
      )}
      {bounty.status === BountyStatus.Paid && (
        <Postmark className={styles.cardMark} tone="coral" top="BNB CHAIN" middle="PAID" />
      )}
      <div className={styles.cardMeta}>
        <span className={styles.cardWhen}>
          <span>{when}</span>
          <span className="mono">From {shortAddress(bounty.poster)}</span>
        </span>
        <span className={styles.cardTags}>
          {!bounty.agentIdOnly && <Tag tone="progress">Any wallet</Tag>}
          <Tag tone={open ? "open" : "progress"}>{STATUS_LABEL[bounty.status]}</Tag>
        </span>
      </div>
    </Link>
  );
}
