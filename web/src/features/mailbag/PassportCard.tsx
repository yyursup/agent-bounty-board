"use client";

import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { Address } from "viem";

import { useAgentRecord } from "@/hooks/useAgent";
import { averageRating } from "@/lib/bounty/types";
import { shortAddress } from "@/lib/format";

import styles from "./Mailbag.module.css";

/**
 * A small passport: jobs paid, average rating, rejections. Numbers bump when they change, so a
 * rating that lands here is felt. The "paid" figure is the target the flying stamp aims at.
 */
export const PassportCard = forwardRef<
  HTMLSpanElement,
  { address: Address; label: string; dark?: boolean }
>(function PassportCard({ address, label, dark }, paidRef) {
  const { record } = useAgentRecord(address);
  const paid = record?.paid ?? 0;
  const avg = record ? averageRating(record) : null;
  const bump = useBump(paid);

  return (
    <Link
      href={`/passport/${address}`}
      className={`${styles.passport} ${dark ? styles.passportDark : ""}`}
    >
      <span aria-hidden="true" className={styles.passportSun} />
      <span className="mono">{label}</span>
      <span className={`mono ${styles.passportAddr}`}>{shortAddress(address)}</span>
      <span className={styles.passportStats}>
        <Stat value={String(paid)} label="paid" bump={bump} ref={paidRef} />
        <Stat value={avg === null ? "—" : avg.toFixed(1)} label="average" bump={bump} />
        <Stat value={String(record?.rejected ?? 0)} label="rejected" />
      </span>
      <span className={styles.passportLink}>Open passport →</span>
    </Link>
  );
});

const Stat = forwardRef<HTMLSpanElement, { value: string; label: string; bump?: number }>(
  function Stat({ value, label, bump = 0 }, ref) {
    return (
      <span className={styles.stat}>
        <span ref={ref} className={bump ? (bump % 2 ? styles.bumpA : styles.bumpB) : undefined}>
          {value}
        </span>
        <span className="mono">{label}</span>
      </span>
    );
  },
);

/** Counts changes to a value after the first render, to restart a bump animation each time. */
function useBump(value: number): number {
  const first = useRef(value);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value !== first.current) {
      first.current = value;
      setN((x) => x + 1);
    }
  }, [value]);
  return n;
}
