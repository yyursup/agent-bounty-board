"use client";

import type { ReactNode } from "react";

import type { AgentTask } from "@/lib/agent/prompts";
import { usePreferredWay } from "@/lib/wallet/preferredWay";

import { AgentPrompt } from "./AgentPrompt";
import { ConnectInline } from "./ConnectInline";
import styles from "./TwoWays.module.css";

/**
 * One action, two ways to do it: sign here with a browser wallet, or copy a prompt for Binance AI
 * Pro. The choice is remembered, so people who prefer one way don't have to switch every time.
 */
export function TwoWays({
  canSign,
  manual,
  task = null,
  agentPending,
  agent,
}: {
  /** True when a wallet is connected on this page. */
  canSign: boolean;
  /** What "Sign here" shows once a wallet is connected. */
  manual: ReactNode;
  /** The prompt, or null while the visitor still has to fill something in. */
  task?: AgentTask | null;
  /** A custom agent side, for flows that prepare their prompt in steps. */
  agent?: ReactNode;
  /** Shown on the agent side while `task` is null. */
  agentPending?: ReactNode;
}) {
  const [way, setWay] = usePreferredWay(canSign ? "wallet" : "agent");

  return (
    <div className={styles.wrap}>
      <div role="tablist" aria-label="How to do it" className={styles.tabs}>
        <button
          type="button"
          role="tab"
          aria-selected={way === "wallet"}
          onClick={() => setWay("wallet")}
        >
          <WalletIcon />
          Sign here
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={way === "agent"}
          onClick={() => setWay("agent")}
        >
          <AgentIcon />
          Binance AI Pro
        </button>
      </div>
      <div key={way} role="tabpanel" className={styles.panel}>
        {way === "wallet" ? (
          canSign ? (
            manual
          ) : (
            <ConnectInline />
          )
        ) : (
          (agent ?? (task ? <AgentPrompt bare task={task} /> : agentPending))
        )}
      </div>
    </div>
  );
}

function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="2.5" y="5" width="15" height="11" rx="2.5" />
      <path d="M13 10.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="14" height="10" rx="3" />
      <path d="M10 2.5V6M7 11h.01M13 11h.01" strokeLinecap="round" />
    </svg>
  );
}
