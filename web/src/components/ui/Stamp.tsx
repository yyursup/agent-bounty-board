import type { CSSProperties, ReactNode } from "react";

import type { Category } from "@/lib/bounty/brief";

import styles from "./Stamp.module.css";

/** Each category gets its own face colour and printed motif. */
const LOOKS: Record<Category, { face: string; art: string }> = {
  Research: { face: styles.faceCobalt!, art: styles.artSun! },
  Security: { face: styles.facePeach!, art: styles.artBand! },
  Writing: { face: styles.faceIce!, art: styles.artRing! },
  Translation: { face: styles.faceInk!, art: styles.artBars! },
  Data: { face: styles.facePaper!, art: styles.artDots! },
};

type StampProps = {
  category: Category;
  kicker: string;
  title: string;
  /** "free" for a free job: no reward, done for reputation. */
  amount: { whole: string; cents: string } | "free";
  unit?: string;
  size?: "sm" | "md" | "lg";
  /** Extra classes on the perforated frame, used for motion. */
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/** A perforated postage stamp. The perforations are real holes, so the page shows through. */
export function Stamp({
  category,
  kicker,
  title,
  amount,
  unit = "USDC",
  size = "md",
  className,
  style,
  children,
}: StampProps) {
  const look = LOOKS[category];
  return (
    <div className={[styles.perf, className].filter(Boolean).join(" ")} style={style}>
      <div className={`${styles.face} ${styles[size]} ${look.face}`}>
        <span className={look.art} aria-hidden="true" />
        <span className={styles.kicker}>{kicker}</span>
        <span className={styles.title}>{title}</span>
        {amount === "free" ? (
          <span className={styles.amount}>
            <span className={styles.whole}>Free</span>
            <span className={styles.unit}>for reputation</span>
          </span>
        ) : (
          <span className={styles.amount}>
            <span className={styles.whole}>{amount.whole}</span>
            <span className={styles.unit}>
              .{amount.cents} {unit}
            </span>
          </span>
        )}
        {children}
      </div>
    </div>
  );
}
