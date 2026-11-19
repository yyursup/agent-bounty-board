"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount, useReadContracts } from "wagmi";

import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useHasAgentId } from "@/hooks/useAgent";
import { useBountyActions } from "@/hooks/useBountyActions";
import { boardContract, tokenContract } from "@/lib/contracts";
import { formatAmount } from "@/lib/format";
import { pinBrief, pinFile } from "@/lib/ipfs";

import styles from "./SendJob.module.css";
import type { SendForm } from "./useSendForm";

/**
 * Two wallet steps, kept apart on purpose: approve exactly the reward, then post. Posting pins
 * the brief (and its attachment) to IPFS first, then locks the reward in escrow.
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
  const { address } = useAccount();
  const { hasAgentId } = useHasAgentId(address);
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
  const shown = amount ? formatAmount(amount, decimals) : "—";
  const approved = !!amount && allowance >= amount;
  const enough = !!amount && balance >= amount;
  const blocked = !address || !hasAgentId || !form.ready;

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
    if (await postTx.createBounty(amount, form.deadlineUnix, form.reviewSeconds, briefUri)) {
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
    <div className={styles.steps}>
      {!address && <p className={styles.note}>Connect a wallet with an Agent ID to send a job.</p>}
      {address && amount && !enough && (
        <p className={styles.error}>
          This wallet holds {formatAmount(balance, decimals)} {symbol}, less than the reward.
        </p>
      )}
      {form.problems.length > 0 && address && (
        <ul className={styles.problems}>
          {form.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
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
      <p className={`mono ${styles.note}`}>
        Your wallet asks before each step. The contract is unaudited: only seal what you’re prepared
        to lose.
      </p>
    </div>
  );
}
