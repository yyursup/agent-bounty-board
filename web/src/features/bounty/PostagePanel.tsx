import type { ReactNode } from "react";

import { env } from "@/lib/config/env";
import { explorerAddressUrl } from "@/lib/contracts";
import type { Bounty } from "@/lib/bounty/types";
import { hours, splitAmount } from "@/lib/format";

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
  return (
    <>
      <div className={styles.postage}>
        <div className={styles.postageFace}>
          <span aria-hidden="true" className={styles.postageSun} />
          <span className="mono">POSTAGE · SEALED IN ESCROW</span>
          <span className={styles.postageAmount}>
            <span>{whole}</span>
            <span className="mono">
              .{cents} {symbol}
            </span>
          </span>
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
