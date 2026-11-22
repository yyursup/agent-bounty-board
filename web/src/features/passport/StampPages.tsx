"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

import styles from "./Passport.module.css";

export type PassportStamp = { id: bigint; amount: string; rating?: number; free?: boolean };

const PER_PAGE = 6;
const TURN_MS = 800;
const SHAPES = [styles.circle, styles.rect, styles.double, styles.oct];
const INKS = [styles.cobalt, styles.coral, styles.ink];
const TILTS = [-10, 6, -4, 8, 3, -7];

type Turn = { from: number; dir: "next" | "prev"; key: number };

/** Pages of job stamps. Turning a page flips the old one over its spine in 3D. */
export function StampPages({ stamps, symbol }: { stamps: PassportStamp[]; symbol: string }) {
  const reduce = useReducedMotion();
  const pages = Math.max(1, Math.ceil(stamps.length / PER_PAGE));
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (to: number, dir: Turn["dir"]) => {
    if (to < 0 || to >= pages || to === page) return;
    clearTimeout(timer.current);
    if (!reduce) {
      setTurn({ from: page, dir, key: Date.now() });
      timer.current = setTimeout(() => setTurn(null), TURN_MS);
    }
    setPage(to);
  };

  return (
    <section aria-label="Stamp pages" className={styles.stamps}>
      <div className={styles.pageBar}>
        <span className="mono">
          Stamps · page {page + 1} of {pages}
        </span>
        <div className={styles.pageNav}>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => go(page - 1, "prev")}
          >
            <Chevron d="M10 3L5 8l5 5" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            disabled={page === pages - 1}
            onClick={() => go(page + 1, "next")}
          >
            <Chevron d="M6 3l5 5-5 5" />
          </button>
        </div>
      </div>

      <div className={styles.pageArea}>
        {stamps.length === 0 ? (
          <p className={styles.blank}>No stamps yet. The first paid job lands here.</p>
        ) : (
          <StampGrid stamps={slice(stamps, page)} symbol={symbol} offset={page * PER_PAGE} />
        )}
        {turn && (
          <div key={turn.key} className={`${styles.turn} ${styles[turn.dir]}`} aria-hidden="true">
            <StampGrid
              stamps={slice(stamps, turn.from)}
              symbol={symbol}
              offset={turn.from * PER_PAGE}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StampGrid({
  stamps,
  symbol,
  offset,
}: {
  stamps: PassportStamp[];
  symbol: string;
  offset: number;
}) {
  return (
    <ul className={styles.grid}>
      {stamps.map((s, i) => {
        const n = offset + i;
        return (
          <li
            key={String(s.id)}
            className={`${styles.stamp} ${SHAPES[n % SHAPES.length]} ${INKS[n % INKS.length]}`}
            style={{ transform: `rotate(${TILTS[n % TILTS.length]}deg)` }}
          >
            <span className="mono">#{String(s.id).padStart(4, "0")}</span>
            <strong>{s.rating ? `${s.rating}/5` : s.free ? "DONE" : "PAID"}</strong>
            <span className="mono">{s.free ? "FREE JOB" : `${s.amount} ${symbol}`}</span>
          </li>
        );
      })}
    </ul>
  );
}

function slice(stamps: PassportStamp[], page: number) {
  return stamps.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
}

function Chevron({ d }: { d: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
