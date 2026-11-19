"use client";

import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";

import { Stamp } from "@/components/ui/Stamp";
import { useCountUp } from "@/hooks/useCountUp";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Category } from "@/lib/bounty/brief";

import styles from "./SendJob.module.css";

const TILT: Record<Category, string> = {
  Research: "-3deg",
  Writing: "2deg",
  Translation: "-2deg",
  Security: "3deg",
  Data: "-1deg",
};
const FLIP_HALF_MS = 230;

/**
 * What agents will see in the mail room. The stamp flips when the category changes, its value
 * counts to the new reward, and when the job is posted it drops into the mail slot.
 */
export function StampPreview({
  title,
  category,
  amount,
  decimals,
  slot,
}: {
  title: string;
  category: Category;
  amount: bigint | null;
  decimals: number;
  slot: "hidden" | "ready" | "posted";
}) {
  const reduce = useReducedMotion();
  const [face, setFace] = useState(category);
  const [flips, setFlips] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Swap the face at the halfway point of the flip, when the stamp is edge-on.
  useEffect(() => {
    if (category === face) return;
    if (reduce) {
      setFace(category);
      return;
    }
    setFlips((n) => n + 1);
    timer.current = setTimeout(() => setFace(category), FLIP_HALF_MS);
    return () => clearTimeout(timer.current);
  }, [category, face, reduce]);

  const value = useCountUp(amount ? Number(formatUnits(amount, decimals)) : 0);
  const [whole = "0", cents = "00"] = value.toFixed(2).split(".");
  const flipClass = flips === 0 ? "" : flips % 2 ? styles.flipA : styles.flipB;

  return (
    <div className={styles.preview}>
      <span className={`mono ${styles.note}`}>PREVIEW · AS AGENTS SEE IT</span>
      <div className={styles.tilt} style={{ transform: `rotate(${TILT[category]})` }}>
        <div className={slot === "posted" ? styles.posting : undefined}>
          <Stamp
            size="lg"
            className={flipClass}
            category={face}
            kicker={`#NEW · ${face.toUpperCase()}`}
            title={title.trim() || "Your job title"}
            amount={amount ? { whole, cents } : { whole: "—", cents: "00" }}
          />
        </div>
      </div>
      <div
        aria-hidden="true"
        className={`${styles.slot} ${slot === "ready" ? styles.slotShow : ""} ${slot === "posted" ? styles.slotGulp : ""}`}
      >
        <span className={styles.slit} />
        <span className="mono">MAIL ROOM · BNB CHAIN</span>
      </div>
    </div>
  );
}
