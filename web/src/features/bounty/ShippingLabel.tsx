"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Postmark } from "@/components/ui/Postmark";
import { Tag, type TagTone } from "@/components/ui/Tag";
import type { Brief } from "@/lib/bounty/brief";
import { STATUS_LABEL } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";
import { formatDateTime, shortAddress } from "@/lib/format";

import styles from "./Parcel.module.css";

const TONE: Record<Bounty["status"], TagTone> = {
  [BountyStatus.None]: "neutral",
  [BountyStatus.Open]: "open",
  [BountyStatus.Claimed]: "progress",
  [BountyStatus.Submitted]: "warn",
  [BountyStatus.Paid]: "good",
  [BountyStatus.Refunded]: "neutral",
};

/**
 * The airmail label at the top of a parcel. When the job is picked up while the page is open,
 * a PICKED UP postmark slams down and the label shakes; on later visits the mark just sits there.
 */
export function ShippingLabel({
  bounty,
  brief,
}: {
  bounty: Bounty;
  brief: Brief | null | undefined;
}) {
  const firstStatus = useRef(bounty.status);
  const [justPicked, setJustPicked] = useState(false);
  useEffect(() => {
    if (bounty.status === BountyStatus.Claimed && firstStatus.current === BountyStatus.Open) {
      setJustPicked(true);
    }
  }, [bounty.status]);

  return (
    <div className={`${styles.label} ${justPicked ? styles.shake : ""}`}>
      <div className={styles.airmail} aria-hidden="true" />
      {bounty.status >= BountyStatus.Claimed && bounty.status !== BountyStatus.Refunded && (
        <Postmark
          className={styles.labelMark}
          animate={justPicked}
          top="BNB CHAIN"
          middle={bounty.status === BountyStatus.Paid ? "PAID" : "PICKED UP"}
          bottom={`#${String(bounty.id).padStart(4, "0")}`}
        />
      )}
      <div className={styles.labelBody}>
        <div className={styles.labelTop}>
          <span className="mono">
            Parcel #{String(bounty.id)} · {brief?.category ?? "…"}
          </span>
          <Tag tone={TONE[bounty.status]}>{STATUS_LABEL[bounty.status]}</Tag>
        </div>
        <h1 className={styles.title}>{brief?.title ?? "Loading brief…"}</h1>
        <dl className={styles.labelFacts}>
          <div>
            <dt>From</dt>
            <dd>{shortAddress(bounty.poster)}</dd>
          </div>
          <div>
            <dt>Deliver by</dt>
            <dd>{formatDateTime(bounty.deadline)}</dd>
          </div>
          <div>
            <dt>Carrier</dt>
            <dd>
              {bounty.status >= BountyStatus.Claimed && bounty.status !== BountyStatus.Refunded ? (
                <Link href={`/passport/${bounty.agent}?from=${bounty.id}`}>
                  {shortAddress(bounty.agent)}
                </Link>
              ) : (
                "Not picked up"
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
