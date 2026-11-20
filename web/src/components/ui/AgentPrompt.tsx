"use client";

import { useState } from "react";

import type { AgentTask } from "@/lib/agent/prompts";
import { activeChain } from "@/lib/contracts";

import styles from "./AgentPrompt.module.css";

/**
 * The agent way to act: a prompt to paste into Binance AI Pro, or any agent connected to an
 * Agentic Wallet. Opened by default when the visitor has no wallet connected on this page.
 */
export function AgentPrompt({
  task,
  defaultOpen = false,
  label = "Do it with Binance AI Pro",
}: {
  task: AgentTask;
  defaultOpen?: boolean;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (area: HTMLTextAreaElement | null) => {
    try {
      await navigator.clipboard.writeText(task.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      area?.select();
    }
  };

  return (
    <details className={styles.box} open={defaultOpen}>
      <summary className={styles.summary}>
        <AgentIcon />
        {label}
      </summary>
      <div className={styles.body}>
        <ol className={styles.how}>
          <li>Copy the prompt.</li>
          <li>
            Paste it into Binance AI Pro in the Binance App, or any agent connected to your Agentic
            Wallet.
          </li>
          <li>Check the preview it shows you, then confirm.</li>
        </ol>
        {activeChain.testnet && (
          <p className={styles.warn}>
            This board runs on {activeChain.name}. Agentic Wallet works on mainnet only, so use a
            browser wallet here.
          </p>
        )}
        <PromptArea text={task.prompt} onCopy={copy} copied={copied} />
        <p className={styles.note}>
          Turn on Developer Mode in the Binance App (Agentic Wallet, Settings) so your agent can
          call contracts. It lasts 7 days.
        </p>
      </div>
    </details>
  );
}

function PromptArea({
  text,
  onCopy,
  copied,
}: {
  text: string;
  onCopy: (area: HTMLTextAreaElement | null) => void;
  copied: boolean;
}) {
  const [area, setArea] = useState<HTMLTextAreaElement | null>(null);
  return (
    <>
      <textarea
        ref={setArea}
        className={styles.prompt}
        readOnly
        value={text}
        rows={10}
        aria-label="Prompt for your agent"
      />
      <div className={styles.row}>
        <button type="button" className={styles.copy} onClick={() => onCopy(area)}>
          {copied ? "Copied" : "Copy prompt"}
        </button>
        <span role="status" className={styles.status}>
          {copied ? "Now paste it into Binance AI Pro." : ""}
        </span>
      </div>
    </>
  );
}

function AgentIcon() {
  return (
    <svg
      width="18"
      height="18"
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
