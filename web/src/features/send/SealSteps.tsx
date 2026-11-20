"use client";

import Link from "next/link";
import { useState } from "react";
import { useReadContracts } from "wagmi";

import { AgentPrompt } from "@/components/ui/AgentPrompt";
import { Button } from "@/components/ui/Button";
import { TwoWays } from "@/components/ui/TwoWays";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { postTask } from "@/lib/agent/prompts";
import { boardContract, tokenContract } from "@/lib/contracts";
import { formatAmount } from "@/lib/format";
import { pinBrief, pinFile } from "@/lib/ipfs";
import { useIdentity } from "@/lib/wallet/identity";

import styles from "./SendJob.module.css";
import type { SendForm } from "./useSendForm";

/**
 * Two ways to seal a job, both in two steps (approve exactly the reward, then post):
 *  - with Binance AI Pro (the main way): the brief is pinned first, then a prompt carries both calls;
 *  - with a browser wallet, right here. Posting needs no Agent ID.
 */
export function SealSteps({
  form,
  decimals,
  symbol,
  onPosted,
}: {
  form: SendForm;
  decimals: number;
  symbol: string;
  onPosted: () => void;
}) {
  const who = useIdentity();
  const amount = form.amount;
  const shown = amount ? formatAmount(amount, decimals) : "—";

  return (
    <div className={styles.steps}>
      {form.problems.length > 0 && (
        <ul className={styles.problems}>
          {form.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <TwoWays
        canSign={who.canSign}
        manual={
          <WalletSeal
            form={form}
            decimals={decimals}
            symbol={symbol}
            shown={shown}
            onPosted={onPosted}
          />
        }
        agent={<AgentSeal form={form} />}
      />

      <p className={`mono ${styles.note}`}>
        You confirm every step, in your wallet or in the Binance App. The contract is unaudited:
        only seal what you’re prepared to lose.
      </p>
    </div>
  );
}

/** Pins the brief, then hands the agent a prompt with the exact approval and the post. */
function AgentSeal({ form }: { form: SendForm }) {
  const ctx = usePromptContext();
  const [pinned, setPinned] = useState<{ key: string; uri: string } | null>(null);
  const [pinning, setPinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The pinned brief belongs to the form as it was; any edit means pinning again.
  const key = JSON.stringify([
    form.toBrief("pending"),
    form.fields.file?.name,
    form.fields.file?.size,
  ]);
  const current = pinned?.key === key ? pinned.uri : null;

  const prepare = async () => {
    setError(null);
    setPinning(true);
    try {
      const attachmentUri =
        form.fields.mode === "attach" && form.fields.file
          ? await pinFile(form.fields.file)
          : undefined;
      setPinned({ key, uri: await pinBrief(form.toBrief(attachmentUri)) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t pin the brief.");
    } finally {
      setPinning(false);
    }
  };

  if (current && form.amount) {
    return (
      <AgentPrompt
        bare
        task={postTask(ctx, {
          title: form.fields.title.trim(),
          reward: form.amount,
          deadline: form.deadlineUnix,
          reviewWindow: form.reviewSeconds,
          agentIdOnly: form.fields.agentIdOnly,
          briefURI: current,
        })}
      />
    );
  }

  return (
    <div className={styles.step}>
      <span className={styles.stepText}>
        <strong>Post with Binance AI Pro</strong>
        <span>We pin the brief to IPFS, then give you a prompt to paste into your agent.</span>
      </span>
      <Button disabled={!form.ready || pinning} onClick={prepare}>
        {pinning ? "Pinning the brief…" : "Prepare the prompt"}
      </Button>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

/** The browser-wallet path: approve exactly the reward, then pin and post. */
function WalletSeal({
  form,
  decimals,
  symbol,
  shown,
  onPosted,
}: {
  form: SendForm;
  decimals: number;
  symbol: string;
  shown: string;
  onPosted: () => void;
}) {
  const { address } = useIdentity();
  const approveTx = useBountyActions();
  const postTx = useBountyActions();
  const [pinning, setPinning] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  const { data } = useReadContracts({
    contracts: [
      { ...tokenContract, functionName: "allowance", args: [address!, boardContract.address] },
      { ...tokenContract, functionName: "balanceOf", args: [address!] },
    ],
    allowFailure: false,
    query: { enabled: !!address },
  });
  const [allowance = 0n, balance = 0n] = data ?? [];

  const amount = form.amount;
  const approved = !!amount && allowance >= amount;
  const enough = !!amount && balance >= amount;
  const blocked = !form.ready;

  const post = async () => {
    if (!amount) return;
    setPinError(null);
    setPinning(true);
    let briefUri: string;
    try {
      const attachmentUri =
        form.fields.mode === "attach" && form.fields.file
          ? await pinFile(form.fields.file)
          : undefined;
      briefUri = await pinBrief(form.toBrief(attachmentUri));
    } catch (e) {
      setPinError(e instanceof Error ? e.message : "Couldn’t pin the brief.");
      return;
    } finally {
      setPinning(false);
    }
    const job = {
      reward: amount,
      deadline: form.deadlineUnix,
      reviewWindow: form.reviewSeconds,
      agentIdOnly: form.fields.agentIdOnly,
      briefURI: briefUri,
    };
    if (await postTx.createBounty(job)) {
      setPosted(true);
      onPosted();
    }
  };

  if (posted) {
    return (
      <div role="status" className={styles.posted}>
        <strong>Your job is in the mail room.</strong>
        <Link href="/board">See it there →</Link>
      </div>
    );
  }

  return (
    <>
      {amount && !enough && (
        <p className={styles.error}>
          This wallet holds {formatAmount(balance, decimals)} {symbol}, less than the reward.
        </p>
      )}
      <ol className={styles.stepList}>
        <li className={styles.step}>
          <span className={styles.stepText}>
            <strong>
              Approve exactly {shown} {symbol}
            </strong>
            <span>Only this amount, only for this board. Never an unlimited approval.</span>
          </span>
          {approved ? (
            <span className={styles.done}>Approved</span>
          ) : (
            <Button
              disabled={blocked || !enough || approveTx.busy}
              onClick={() => amount && approveTx.approveReward(amount)}
            >
              Approve in wallet
            </Button>
          )}
        </li>
        <li className={`${styles.step} ${approved ? "" : styles.stepWaiting}`}>
          <span className={styles.stepText}>
            <strong>Post and seal the postage</strong>
            <span>
              Pins the brief to IPFS, then moves {shown} {symbol} into escrow.
            </span>
          </span>
          <Button disabled={blocked || !approved || pinning || postTx.busy} onClick={post}>
            {pinning ? "Pinning the brief…" : "Post in wallet"}
          </Button>
        </li>
      </ol>
      <TxStatus phase={approveTx.phase} error={approveTx.error} hash={approveTx.hash} />
      {pinError && (
        <p role="alert" className={styles.error}>
          {pinError}
        </p>
      )}
      <TxStatus phase={postTx.phase} error={postTx.error} hash={postTx.hash} />
    </>
  );
}
