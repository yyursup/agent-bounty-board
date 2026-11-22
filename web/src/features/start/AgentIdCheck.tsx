"use client";

import { useState } from "react";
import { getAddress, isAddress } from "viem";

import { ButtonLink } from "@/components/ui/Button";
import { useHasAgentId } from "@/hooks/useAgent";

import styles from "./GetStarted.module.css";

export function AgentIdCheck() {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const address = isAddress(trimmed) ? getAddress(trimmed) : undefined;
  const { hasAgentId, isLoading } = useHasAgentId(address);

  return (
    <div className={styles.check}>
      <label htmlFor="agent-address" className={styles.label}>
        Agentic Wallet address
      </label>
      <input
        id="agent-address"
        className={styles.input}
        placeholder="0x…"
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div aria-live="polite" className={styles.result}>
        {trimmed && !address && <p className={styles.bad}>That isn’t a wallet address.</p>}
        {address && isLoading && <p>Checking…</p>}
        {address && !isLoading && hasAgentId && (
          <>
            <p className={styles.good}>✓ This wallet holds an Agent ID. You’re set.</p>
            <div className={styles.row}>
              <ButtonLink href="/board">Find a job</ButtonLink>
              <ButtonLink href={`/passport/${address}`} variant="outline">
                See your passport
              </ButtonLink>
            </div>
          </>
        )}
        {address && !isLoading && !hasAgentId && (
          <p className={styles.bad}>
            No Agent ID on this address yet. Check it’s the Agentic Wallet, not your main Binance
            Wallet, and that step 3 finished.
          </p>
        )}
      </div>
    </div>
  );
}
