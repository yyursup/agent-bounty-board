"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";

import { useHasAgentId } from "@/hooks/useAgent";
import { activeChain } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";
import { useViewingAddress } from "@/lib/wallet/identity";

import styles from "./Header.module.css";

/**
 * Two ways in from the header:
 *  - Connect wallet: Binance Wallet first, then any browser wallet. It can sign from this page.
 *  - View by address: paste an Agentic Wallet address to see its jobs. Nothing is signed; its
 *    owner acts by pasting prompts into Binance AI Pro.
 * There is no QR or pairing-code login, as the hackathon rules require.
 */
export function WalletButton() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [viewing, setViewing] = useViewingAddress();
  const shown = address ?? viewing;
  const { hasAgentId } = useHasAgentId(shown);

  if (isConnected && address && chainId !== activeChain.id) {
    return (
      <button
        type="button"
        className={`${styles.wallet} ${styles.walletWarn}`}
        onClick={() => switchChain({ chainId: activeChain.id })}
      >
        Switch to {activeChain.name}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        className={styles.wallet}
        onClick={() => disconnect()}
        title="Disconnect"
      >
        <AgentIdMark ok={hasAgentId} />
        <span className={styles.address}>{shortAddress(address)}</span>
      </button>
    );
  }

  if (viewing) {
    return (
      <span className={styles.viewing}>
        <AgentIdMark ok={hasAgentId} />
        <span>Viewing {shortAddress(viewing)}</span>
        <button
          type="button"
          aria-label="Stop viewing this address"
          onClick={() => setViewing(undefined)}
        >
          ×
        </button>
      </span>
    );
  }

  const injected = connectors[0];
  return (
    <div className={styles.entry}>
      <ViewByAddress onView={setViewing} />
      <button
        type="button"
        className={styles.wallet}
        disabled={!injected || isPending}
        onClick={() => injected && connect({ connector: injected })}
      >
        {isPending ? "Check your wallet…" : "Connect wallet"}
      </button>
    </div>
  );
}

function AgentIdMark({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? styles.idOk : styles.idNo}>
      {ok && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      )}
      {ok ? "Agent ID" : "No Agent ID"}
    </span>
  );
}

/** A small popover to paste an address. Only for viewing; it grants nothing. */
function ViewByAddress({ onView }: { onView: (address: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const valid = isAddress(value.trim());

  return (
    <div className={styles.popWrap}>
      <button
        type="button"
        className={styles.linkish}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        View by address
      </button>
      {open && (
        <form
          className={styles.pop}
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onView(value.trim());
            setOpen(false);
          }}
        >
          <label htmlFor="view-address">Your Agentic Wallet address</label>
          <input
            id="view-address"
            className="mono"
            placeholder="0x…"
            value={value}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
          />
          <p>See your jobs and passport. Nothing is signed: you act through Binance AI Pro.</p>
          <button type="submit" disabled={!valid}>
            View
          </button>
        </form>
      )}
    </div>
  );
}
