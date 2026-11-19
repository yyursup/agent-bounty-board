import { formatClock } from "@/lib/format";

import styles from "./Countdown.module.css";

/** A live clock towards `target`. Turns urgent in the final hour. */
export function Countdown({ target, now, label }: { target: number; now: number; label: string }) {
  const left = target - now;
  const urgent = left > 0 && left < 3600;
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.clock} ${urgent ? styles.urgent : ""}`} role="timer">
        {formatClock(target, now)}
      </span>
    </div>
  );
}
