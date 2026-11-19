import type { ReactNode } from "react";

import styles from "./Notice.module.css";

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "dark" | "error";
  children: ReactNode;
}) {
  return (
    <div role={tone === "error" ? "alert" : "note"} className={`${styles.notice} ${styles[tone]}`}>
      {children}
    </div>
  );
}
