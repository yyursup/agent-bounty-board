"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Tag, type TagTone } from "@/components/ui/Tag";
import { useBrief } from "@/hooks/useBrief";
import { STATUS_LABEL } from "@/lib/bounty/lifecycle";
import type { Bounty } from "@/lib/bounty/types";
import { formatAmount } from "@/lib/format";

import styles from "./Mailbag.module.css";

/** The frame every job in the mailbag shares; the body says what to do next. */
export function JobCard({
  bounty,
  decimals,
  symbol,
  tone,
  children,
}: {
  bounty: Bounty;
  decimals: number;
  symbol: string;
  tone: TagTone;
  children: ReactNode;
}) {
  const { data: brief } = useBrief(bounty.briefURI);
  return (
    <article className={styles.job}>
      <div className={styles.jobTop}>
        <span className="mono">
          #{String(bounty.id).padStart(4, "0")} · {brief?.category ?? "…"} ·{" "}
          {bounty.reward === 0n ? "Free job" : `${formatAmount(bounty.reward, decimals)} ${symbol}`}
        </span>
        <Tag tone={tone}>{STATUS_LABEL[bounty.status]}</Tag>
      </div>
      <h2 className={styles.jobTitle}>
        <Link href={`/bounty/${bounty.id}`}>{brief?.title ?? "Loading brief…"}</Link>
      </h2>
      {children}
    </article>
  );
}
