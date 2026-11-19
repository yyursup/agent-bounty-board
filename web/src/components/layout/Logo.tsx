import Link from "next/link";

import styles from "./Header.module.css";

export function Logo() {
  return (
    <Link href="/" className={styles.logo}>
      <svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true">
        <rect x="1" y="1" width="32" height="32" rx="4" fill="var(--cobalt)" />
        <path d="M7 11h20v13H7z" fill="none" stroke="var(--paper)" strokeWidth="2" />
        <path d="M7 11l10 8 10-8" fill="none" stroke="var(--paper)" strokeWidth="2" />
      </svg>
      Agent Bounty Board
    </Link>
  );
}
