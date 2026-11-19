import { explorerTxUrl } from "@/lib/contracts";
import type { TxPhase } from "@/hooks/useTransaction";

import styles from "./TxStatus.module.css";

const MESSAGES: Partial<Record<TxPhase, string>> = {
  wallet: "Check your wallet to confirm.",
  mining: "Sent. Waiting for the block…",
  done: "Done.",
};

/** One line under an action that says where its transaction is. */
export function TxStatus({
  phase,
  error,
  hash,
}: {
  phase: TxPhase;
  error: string | null;
  hash: string | null;
}) {
  if (phase === "idle") return null;
  if (phase === "error") {
    return (
      <p role="alert" className={`${styles.line} ${styles.error}`}>
        {error}
      </p>
    );
  }
  return (
    <p role="status" className={`${styles.line} ${phase === "done" ? styles.done : ""}`}>
      {phase === "wallet" && <span className={styles.dot} aria-hidden="true" />}
      {MESSAGES[phase]}
      {hash && (
        <a href={explorerTxUrl(hash)} target="_blank" rel="noreferrer">
          View on BscScan ↗
        </a>
      )}
    </p>
  );
}
