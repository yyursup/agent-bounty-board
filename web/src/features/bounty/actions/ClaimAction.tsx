"use client";

import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import type { Bounty } from "@/lib/bounty/types";

import styles from "./Actions.module.css";

export function ClaimAction({ bounty }: { bounty: Bounty }) {
  const { claim, phase, error, hash, busy } = useBountyActions();
  return (
    <div className={styles.stack}>
      <Button size="lg" disabled={busy} onClick={() => claim(bounty.id)}>
        Pick up this parcel
      </Button>
      <p className={styles.hint}>
        Your wallet asks you to confirm. Nothing is signed for you, by us or by your agent.
      </p>
      <TxStatus phase={phase} error={error} hash={hash} />
    </div>
  );
}
