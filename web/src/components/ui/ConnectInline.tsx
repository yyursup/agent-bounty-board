"use client";

import { useConnect } from "wagmi";

import { Button } from "./Button";
import styles from "./TwoWays.module.css";

/** Connect a browser wallet right where the action is, without going back to the header. */
export function ConnectInline({
  hint = "Binance Wallet is picked first. The wallet must hold an Agent ID, or the board will refuse it.",
}: {
  hint?: string;
} = {}) {
  const { connect, connectors, isPending, error } = useConnect();
  const injected = connectors[0];

  if (!injected) {
    return (
      <p className={styles.hint}>
        No browser wallet found. Open this page in the Binance App’s browser, or install a wallet
        extension.
      </p>
    );
  }

  return (
    <div className={styles.connect}>
      <Button disabled={isPending} onClick={() => connect({ connector: injected })}>
        {isPending ? "Check your wallet…" : "Connect wallet to sign here"}
      </Button>
      <p className={styles.hint}>
        Binance Wallet is picked first. The wallet must hold an Agent ID, or the board will refuse
        it.
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error.message.split("\n")[0]}
        </p>
      )}
    </div>
  );
}
