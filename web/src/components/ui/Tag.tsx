import type { ReactNode } from "react";

import styles from "./Tag.module.css";

export type TagTone = "open" | "progress" | "warn" | "good" | "neutral";

export function Tag({ tone = "neutral", children }: { tone?: TagTone; children: ReactNode }) {
  return <span className={`${styles.tag} ${styles[tone]}`}>{children}</span>;
}
