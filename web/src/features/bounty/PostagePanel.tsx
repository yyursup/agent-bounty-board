"use client";

import type { ReactNode } from "react";

import { usePosterRecord } from "@/hooks/useAgent";
import { posterAveragePercent, splitReward, type Bounty } from "@/lib/bounty/types";
import { env } from "@/lib/config/env";
import { explorerAddressUrl } from "@/lib/contracts";
import { formatAmount, hours, splitAmount } from "@/lib/format";

import styles from "./Parcel.module.css";

/** The big postage stamp, the terms, and whatever action the visitor can take. */
export function PostagePanel({
  bounty,
  decimals,
  symbol,
  children,
}: {
  bounty: Bounty;
  decimals: number;
  symbol: string;
  children: ReactNode;
}) {
  const { whole, cents } = splitAmount(bounty.reward, decimals);
  const free = bounty.reward === 0n;
  const { record: sender } = usePosterRecord(bounty.poster);
  const senderAvg = sender ? posterAveragePercent(sender) : null;
  return (
    <>
      <div className={styles.postage}>
        <div className={styles.postageFace}>
          <span aria-hidden="true" className={styles.postageSun} />
          <span className="mono">{free ? "POSTAGE · FREE JOB" : "POSTAGE · SEALED IN ESCROW"}</span>
          {free ? (
            <span className={styles.postageAmount}>
              <span>Free</span>
              <span className="mono">for reputation</span>
            </span>
          ) : (
            <span className={styles.postageAmount}>
              <span>{whole}</span>
              <span className="mono">
                .{cents} {symbol}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className={styles.panel}>
        <dl className={styles.terms}>
          <div>
            <dt>Review window</dt>
            <dd>{hours(bounty.reviewWindow)}</dd>
          </div>
          <div>
            <dt>Who can pick up</dt>
            <dd>{bounty.agentIdOnly ? "Agent ID holders" : "Any wallet"}</dd>
          </div>
          {free ? (
            <div>
              <dt>What the carrier gets</dt>
              <dd>A rating on their free-job record, kept apart from paid work</dd>
            </div>
          ) : (
            <div>
              <dt>Floor once delivered</dt>
              <dd>
                {bounty.floorBps / 100}% ·{" "}
                {formatAmount(splitReward(bounty.reward, bounty.floorBps).toAgent, decimals)}{" "}
                {symbol}
              </dd>
            </div>
          )}
          <div>
            <dt>Sender’s record</dt>
            <dd>
              {!sender
                ? "…"
                : [
                    senderAvg === null
                      ? null
                      : `Pays ${Math.round(senderAvg)}% on average · ${sender.settled} settled`,
                    sender.freeSettled ? `${sender.freeSettled} free rated` : null,
                    sender.unanswered ? `${sender.unanswered} unanswered` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "First job"}
            </dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>
              <a href={explorerAddressUrl(env.boardAddress)} target="_blank" rel="noreferrer">
                BscScan ↗
              </a>
            </dd>
          </div>
        </dl>
        {children}
      </div>
    </>
  );
}
