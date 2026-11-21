"use client";

import { zeroAddress } from "viem";
import { useReadContracts } from "wagmi";

import { boardContract } from "@/lib/contracts";
import { explorerAddressUrl } from "@/lib/contracts/chain";
import { env } from "@/lib/config/env";
import { shortAddress } from "@/lib/format";

import styles from "./Landing.module.css";

const CAN = [
  [
    "Pause new jobs",
    "pause() / unpause(). Stops new posts only. Claiming, delivering, settling, releases and refunds keep working while paused.",
  ],
  [
    "Set the floor range for new jobs",
    "setFloorRange(min, max), at most 90%. Jobs already posted keep the floor they were posted with.",
  ],
  [
    "Hand over or give up ownership",
    "transferOwnership(to): the new owner has to accept before it takes effect. renounceOwnership() gives it up for good.",
  ],
] as const;

const CANNOT = [
  "Withdraw, move or redirect rewards held in escrow",
  "Freeze a wallet or block a payout or refund",
  "Mint tokens, charge fees or take a cut. The board charges nothing",
  "Edit a posted job, its reward, its floor or who gets paid",
  "Upgrade the contract. Its code is fixed and verified on BscScan",
] as const;

/**
 * Everything the contract owner can and can't do, with the live values, so nobody has to read the
 * Solidity to know who holds which key. The hackathon rules ask for exactly this disclosure.
 */
export function OwnerPermissions() {
  const { data } = useReadContracts({
    allowFailure: true,
    contracts: [
      { ...boardContract, functionName: "owner" },
      { ...boardContract, functionName: "pendingOwner" },
      { ...boardContract, functionName: "paused" },
      { ...boardContract, functionName: "minFloorBps" },
      { ...boardContract, functionName: "maxFloorBps" },
    ],
    query: { enabled: env.isConfigured },
  });
  const [owner, pending, paused, minFloor, maxFloor] = (data ?? []).map((r) => r.result);

  return (
    <section id="owner" aria-labelledby="owner-h" className={styles.owner}>
      <h2 id="owner-h" className={styles.h2}>
        Owner permissions
      </h2>
      <p className={styles.ownerLede}>
        The contract has one owner key. This is the whole list of what it can do, read straight from
        the{" "}
        <a href={`${explorerAddressUrl(env.boardAddress)}#code`} target="_blank" rel="noreferrer">
          verified contract
        </a>
        .
      </p>

      <dl className={`mono ${styles.ownerLive}`}>
        <div>
          <dt>Owner</dt>
          <dd>
            {typeof owner === "string" ? (
              <a href={explorerAddressUrl(owner)} target="_blank" rel="noreferrer">
                {shortAddress(owner)} ↗
              </a>
            ) : (
              "…"
            )}
            {typeof pending === "string" && pending !== zeroAddress
              ? ` · handing over to ${shortAddress(pending)}`
              : ""}
          </dd>
        </div>
        <div>
          <dt>New jobs</dt>
          <dd>{paused === undefined ? "…" : paused ? "Paused" : "Open"}</dd>
        </div>
        <div>
          <dt>Floor range</dt>
          <dd>
            {typeof minFloor === "number" && typeof maxFloor === "number"
              ? `${minFloor / 100}% to ${maxFloor / 100}%`
              : "…"}
          </dd>
        </div>
      </dl>

      <div className={styles.ownerCols}>
        <div>
          <h3>The owner can</h3>
          <ul>
            {CAN.map(([title, body]) => (
              <li key={title}>
                <strong>{title}</strong>
                <span>{body}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>The owner can’t</h3>
          <ul className={styles.ownerCannot}>
            {CANNOT.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
