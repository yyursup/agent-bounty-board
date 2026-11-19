import type { CSSProperties } from "react";

import styles from "./Postmark.module.css";

/** A round cancellation mark. `animate` stamps it down when it first appears. */
export function Postmark({
  top,
  middle,
  bottom,
  tone = "cobalt",
  animate = false,
  className,
  style,
}: {
  top: string;
  middle: string;
  bottom?: string;
  tone?: "cobalt" | "coral";
  animate?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={[styles.mark, styles[tone], animate && styles.slam, className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <span className={styles.small}>{top}</span>
      <span className={styles.big}>{middle}</span>
      {bottom && <span className={styles.small}>{bottom}</span>}
    </span>
  );
}
