"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { isAddressEqual, type Address } from "viem";

import { Notice } from "@/components/ui/Notice";
import { useBounties } from "@/hooks/useBounties";
import { useNow } from "@/hooks/useNow";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRewardToken } from "@/hooks/useRewardToken";
import { isLive } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";

import { useIdentity } from "@/lib/wallet/identity";

import { CarrierJob } from "./CarrierJob";
import { FlyingStamp, type Flight } from "./FlyingStamp";
import styles from "./Mailbag.module.css";
import { PassportCard } from "./PassportCard";
import { SenderJob } from "./SenderJob";

type Role = "carrier" | "sender";

/** Everything the connected wallet is carrying or has sent, and what each one needs next. */
export function Mailbag() {
  const { address, canSign, mode } = useIdentity();
  const { bounties, isLoading } = useBounties();
  const { decimals, symbol } = useRewardToken();
  const now = useNow();
  const reduce = useReducedMotion();

  const [role, setRole] = useState<Role>("carrier");
  const [focusAgent, setFocusAgent] = useState<Address | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const paidRef = useRef<HTMLSpanElement>(null);
  const land = useCallback(() => setFlight(null), []);

  const { carrying, sent } = useMemo(() => split(bounties, address), [bounties, address]);

  if (!address) {
    return (
      <>
        <Title role={role} onRole={setRole} />
        <Notice>
          Connect your wallet, or use “View by address” at the top with your Agentic Wallet address,
          to see the jobs you carry and the ones you sent.
        </Notice>
      </>
    );
  }

  const asideAgent =
    role === "carrier"
      ? address
      : (focusAgent ?? sent.find((b) => b.status === BountyStatus.Submitted)?.agent);

  const flyFrom = (rating: number, from: HTMLElement | null) => {
    const to = paidRef.current;
    if (reduce || !from || !to) return;
    setFlight({ rating, from: from.getBoundingClientRect(), to: to.getBoundingClientRect() });
  };

  const list = role === "carrier" ? carrying : sent;

  return (
    <>
      <Title role={role} onRole={setRole} />
      {mode === "viewing" && (
        <Notice>
          You’re viewing this address without a wallet connected. Each job below has a prompt: paste
          it into Binance AI Pro and your agent does the rest.
        </Notice>
      )}
      <div className={styles.layout}>
        <div role="tabpanel" className={styles.list}>
          {isLoading && <p className={styles.empty}>Opening the mailbag…</p>}
          {!isLoading && list.length === 0 && (
            <p className={styles.empty}>
              {role === "carrier"
                ? "Nothing in your bag. Pick something up in the mail room."
                : "You haven’t sent anything that’s still in transit."}
            </p>
          )}
          {list.map((b) =>
            role === "carrier" ? (
              <CarrierJob
                key={String(b.id)}
                bounty={b}
                me={address}
                canSign={canSign}
                now={now}
                decimals={decimals}
                symbol={symbol}
              />
            ) : (
              <SenderJob
                key={String(b.id)}
                bounty={b}
                me={address}
                canSign={canSign}
                now={now}
                decimals={decimals}
                symbol={symbol}
                onFocus={() => setFocusAgent(b.agent)}
                onSigned={flyFrom}
              />
            ),
          )}
        </div>

        <aside aria-label="Passport" className={styles.aside}>
          {asideAgent && (
            <PassportCard
              ref={paidRef}
              address={asideAgent}
              label={role === "carrier" ? "YOUR PASSPORT · AGENT ID" : "CARRIER · AGENT ID"}
              dark={role === "sender"}
            />
          )}
          <p className={styles.lock}>
            Your agent can draft deliveries and claims for you. Each one still waits for your
            wallet.
          </p>
        </aside>
      </div>
      {flight && <FlyingStamp flight={flight} onLanded={land} />}
    </>
  );
}

function Title({ role, onRole }: { role: Role; onRole: (r: Role) => void }) {
  return (
    <div className={styles.head}>
      <h1 className={styles.title}>My mailbag</h1>
      <div role="tablist" aria-label="Role" className={styles.tabs}>
        {(["carrier", "sender"] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={role === r}
            onClick={() => onRole(r)}
          >
            As {r}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Live jobs this wallet carries, and live jobs it sent. */
function split(bounties: Bounty[], me: Address | undefined) {
  if (!me) return { carrying: [], sent: [] };
  const live = bounties.filter(isLive);
  return {
    carrying: live.filter((b) => isAddressEqual(b.agent, me)),
    sent: live.filter((b) => isAddressEqual(b.poster, me)),
  };
}
