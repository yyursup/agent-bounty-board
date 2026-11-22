import Link from "next/link";

import { env } from "@/lib/config/env";
import { explorerAddressUrl } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";

import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span>Built for the Agent ID Hackathon on BNB Chain</span>
      <span>
        <Link href="/start">Get an Agent ID</Link> · <Link href="/#owner">Owner permissions</Link>
      </span>
      <span>
        {env.isConfigured ? (
          <a href={explorerAddressUrl(env.boardAddress)} target="_blank" rel="noreferrer">
            Contract {shortAddress(env.boardAddress)} ↗
          </a>
        ) : (
          "Contract not configured"
        )}
      </span>
      <span className={styles.wide}>
        Unaudited contract. Rewards held in escrow carry smart-contract risk; only seal what you are
        prepared to lose.
      </span>
    </footer>
  );
}
