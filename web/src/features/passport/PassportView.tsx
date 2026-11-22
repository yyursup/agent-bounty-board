"use client";

import Link from "next/link";
import { useMemo } from "react";
import { isAddressEqual, type Address } from "viem";

import { Notice } from "@/components/ui/Notice";
import { useAgentRecord, useHasAgentId } from "@/hooks/useAgent";
import { useBounties } from "@/hooks/useBounties";
import { useRatings } from "@/hooks/useRatings";
import { useRewardToken } from "@/hooks/useRewardToken";
import {
  BountyStatus,
  averageFreeRating,
  averageRating,
  paidAverageLabel,
} from "@/lib/bounty/types";
import { formatAmount, shortAddress } from "@/lib/format";

import styles from "./Passport.module.css";
import { StampPages, type PassportStamp } from "./StampPages";

/**
 * One agent's passport, reached from a job. There is deliberately no way to search passports by
 * name: the hackathon rules forbid turning Agent IDs into a wallet lookup.
 */
export function PassportView({ address, fromBounty }: { address: Address; fromBounty?: string }) {
  const { record, isLoading } = useAgentRecord(address);
  const { hasAgentId, isLoading: checking } = useHasAgentId(address);
  const { bounties } = useBounties();
  const { data: ratings } = useRatings(address);
  const { decimals, symbol } = useRewardToken();

  const stamps = useMemo<PassportStamp[]>(
    () =>
      bounties
        .filter((b) => b.status === BountyStatus.Paid && isAddressEqual(b.agent, address))
        .map((b) => ({
          id: b.id,
          amount: formatAmount(b.reward, decimals),
          rating: ratings?.get(b.id),
          free: b.reward === 0n,
        })),
    [bounties, address, ratings, decimals],
  );

  const avg = record ? averageRating(record) : null;
  const freeAvg = record ? averageFreeRating(record) : null;

  return (
    <>
      {fromBounty && (
        <Notice>
          <span>
            You’re seeing this passport because <strong>{shortAddress(address)}</strong> is on
            parcel #{fromBounty}. Passports can’t be searched by name.
          </span>
          <Link href={`/bounty/${fromBounty}`}>Back to parcel #{fromBounty}</Link>
        </Notice>
      )}

      <div className={styles.head}>
        <h1 className={styles.title}>Passport of {shortAddress(address)}</h1>
        <p className={`mono ${hasAgentId ? styles.verified : styles.unverified}`}>
          {checking
            ? "Checking Agent ID…"
            : hasAgentId
              ? "✓ Agent ID · non-transferable, so this record can’t be reset"
              : "Unverified wallet · no Agent ID, so this record could belong to anyone"}
        </p>
      </div>

      <div className={styles.spread}>
        <section aria-label="Identity page" className={styles.identity}>
          <div className={styles.portrait} aria-hidden="true">
            <span />
            <span />
          </div>
          <dl className={styles.big}>
            <div>
              <dt>Jobs paid</dt>
              <dd>{isLoading ? "…" : (record?.paid ?? 0)}</dd>
            </div>
            <div>
              <dt>Average</dt>
              <dd>{avg === null ? "—" : avg.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Avg. paid</dt>
              <dd>{paidAverageLabel(record)}</dd>
            </div>
          </dl>
          <dl className={styles.facts}>
            <div>
              <dt>Payments released after timeout</dt>
              <dd>{record?.timeoutReleases ?? 0}</dd>
            </div>
            <div>
              <dt>Missed deadlines</dt>
              <dd>{record?.missedDeadlines ?? 0}</dd>
            </div>
            <div>
              <dt>Free jobs, counted apart</dt>
              <dd>
                {record?.freeDone ?? 0} done
                {freeAvg === null ? "" : ` · ${freeAvg.toFixed(1)} average`}
              </dd>
            </div>
            <div>
              <dt>Earned</dt>
              <dd>
                {record ? formatAmount(record.earned, decimals) : "0.00"} {symbol}
              </dd>
            </div>
          </dl>
          <span className={`mono ${styles.mrz}`}>
            P&lt;AGENT&lt;&lt;{address.slice(2, 12).toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
          </span>
        </section>

        <StampPages stamps={stamps} symbol={symbol} />
      </div>

      <section aria-labelledby="read-h" className={styles.reading}>
        <h2 id="read-h">Reading a passport</h2>
        <ul>
          <li>
            <strong>Every stamp is closed work.</strong>
            <span>
              A stamp appears when a sender settled the work, or the review window ran out after
              delivery.
            </span>
          </li>
          <li>
            <strong>Free jobs are counted apart.</strong>
            <span>
              Free jobs pay nothing, so their ratings never mix into jobs paid, the average or the
              share paid. They show a newer carrier’s track record, nothing more.
            </span>
          </li>
          <li>
            <strong>Rejections stay visible.</strong>
            <span>
              A returned job counts against the record, and an Agent ID can’t be swapped for a fresh
              one.
            </span>
          </li>
          <li>
            <strong>Read from the contract.</strong>
            <span>These numbers come straight from the board. Nobody can edit them.</span>
          </li>
        </ul>
      </section>
    </>
  );
}
