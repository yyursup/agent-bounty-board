"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";

import { Notice } from "@/components/ui/Notice";
import { useBounties } from "@/hooks/useBounties";
import { useBriefs } from "@/hooks/useBrief";
import { useNow } from "@/hooks/useNow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRewardToken } from "@/hooks/useRewardToken";
import type { Brief } from "@/lib/bounty/brief";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";

import { BountyCard } from "./BountyCard";
import { CategoryFilter, type CategoryChoice } from "./CategoryFilter";
import styles from "./MailRoom.module.css";

/** How long the stamps that no longer match take to fall away before the grid re-deals. */
const SORT_OUT_MS = 320;

function matches(brief: Brief | null | undefined, choice: CategoryChoice) {
  return choice === "All" || brief?.category === choice;
}

/** Open jobs first, closing soonest; then everything else, newest first. */
function byPickupOrder(a: Bounty, b: Bounty) {
  const ao = a.status === BountyStatus.Open;
  const bo = b.status === BountyStatus.Open;
  if (ao !== bo) return ao ? -1 : 1;
  return ao ? a.deadline - b.deadline : Number(b.id - a.id);
}

export function MailRoom() {
  const { bounties, isLoading, error } = useBounties();
  const briefs = useBriefs(bounties.map((b) => b.briefURI));
  const { decimals } = useRewardToken();
  const now = useNow(30_000);
  const reduce = useReducedMotion();

  const [category, setCategory] = useState<CategoryChoice>("All");
  const [pending, setPending] = useState<CategoryChoice | null>(null);
  const [openOnly, setOpenOnly] = useState(true);
  const [deal, setDeal] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (next: CategoryChoice) => {
    if (next === (pending ?? category)) return;
    clearTimeout(timer.current);
    if (reduce) {
      setCategory(next);
      return;
    }
    setPending(next);
    timer.current = setTimeout(() => {
      setCategory(next);
      setPending(null);
      setDeal((d) => d + 1);
    }, SORT_OUT_MS);
  };

  const shown = useMemo(
    () =>
      bounties
        .filter((b) => !openOnly || b.status === BountyStatus.Open)
        .filter((b) => matches(briefs.get(b.briefURI), category))
        .sort(byPickupOrder),
    [bounties, briefs, category, openOnly],
  );

  return (
    <>
      <MailbagReminder bounties={bounties} />

      <div className={styles.head}>
        <h1 className={styles.title}>The mail room</h1>
        <p className={styles.lede}>
          Open jobs waiting for pickup, closest deadline first. Every paid reward is already sealed
          in escrow; free jobs build a record for carriers with an Agent ID.
        </p>
      </div>

      <div role="toolbar" aria-label="Filter jobs" className={styles.toolbar}>
        <CategoryFilter value={pending ?? category} onChange={choose} />
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
          />
          Open only
        </label>
      </div>

      {error && (
        <Notice tone="error">Couldn’t read the board. Check the network and try again.</Notice>
      )}

      {isLoading ? (
        <p className={styles.empty}>Sorting the post…</p>
      ) : shown.length === 0 ? (
        <p className={styles.empty}>Nothing here yet. Send the first job.</p>
      ) : (
        <ul className={styles.grid}>
          {shown.map((bounty, i) => {
            const brief = briefs.get(bounty.briefURI);
            const leaving = pending !== null && !matches(brief, pending);
            return (
              <li
                key={String(bounty.id)}
                className={leaving ? styles.out : deal % 2 ? styles.dealB : styles.dealA}
                style={{ animationDelay: leaving ? "0ms" : `${i * 70}ms` }}
              >
                <BountyCard bounty={bounty} brief={brief} decimals={decimals} now={now} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** A dark strip that points to the mailbag when something there needs the visitor. */
function MailbagReminder({ bounties }: { bounties: Bounty[] }) {
  const { address } = useAccount();
  if (!address) return null;
  const me = address.toLowerCase();
  const waiting = bounties.filter(
    (b) => b.status === BountyStatus.Submitted && b.poster.toLowerCase() === me,
  ).length;
  if (waiting === 0) return null;
  return (
    <Notice tone="dark">
      <span>
        {waiting === 1 ? "A delivery is" : `${waiting} deliveries are`} waiting for your signature.
      </span>
      <Link href="/mailbag">Open mailbag →</Link>
    </Notice>
  );
}
