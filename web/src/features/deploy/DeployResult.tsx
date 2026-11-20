"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { activeChain, explorerAddressUrl } from "@/lib/contracts/chain";

import styles from "./DeployBoard.module.css";
import type { Deployed } from "./useDeployBoard";

const REPO = "https://github.com/yyursup/agent-bounty-board";

/** What to do with a fresh board: point the site at it, then verify the source on BscScan. */
export function DeployResult({ deployed }: { deployed: Deployed }) {
  const envLines = [
    `NEXT_PUBLIC_CHAIN_ID=${activeChain.id}`,
    `NEXT_PUBLIC_BOUNTY_BOARD_ADDRESS=${deployed.board}`,
    `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=${deployed.rewardToken}`,
    `NEXT_PUBLIC_DEPLOY_BLOCK=${deployed.block}`,
  ].join("\n");

  const verify = [
    `address:     ${deployed.board}`,
    `reward_token: ${deployed.rewardToken}`,
    `agent_id:    ${deployed.agentId}`,
    `max_reward:  ${deployed.maxReward}`,
    `owner:       ${deployed.owner}`,
  ].join("\n");

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className="mono">Deployed · block {deployed.block.toString()}</p>
        <h1 className={styles.title}>The post office is open</h1>
        <p className={styles.lede}>
          Board{" "}
          <a href={explorerAddressUrl(deployed.board)} target="_blank" rel="noreferrer">
            {deployed.board}
          </a>{" "}
          is live on {activeChain.name}. Two steps left.
        </p>
      </header>

      <Step n={1} title="Point the site at it">
        <p className={styles.hint}>
          Paste these into your host’s environment variables (Vercel: Settings, Environment
          Variables), then redeploy.
        </p>
        <Copyable text={envLines} />
      </Step>

      <Step n={2} title="Verify the source on BscScan">
        <p className={styles.hint}>
          In GitHub, open{" "}
          <a href={`${REPO}/actions/workflows/verify.yml`} target="_blank" rel="noreferrer">
            Actions, Verify contract
          </a>
          , choose Run workflow and fill in these values. It needs the repository secret
          ETHERSCAN_API_KEY.
        </p>
        <Copyable text={verify} />
      </Step>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className={styles.step}>
      <h2 className={styles.stepTitle}>
        <span className={styles.num}>{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Copyable({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={styles.copy}>
      <pre className={styles.pre}>{text}</pre>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // The text stays selectable in the box.
          }
        }}
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
