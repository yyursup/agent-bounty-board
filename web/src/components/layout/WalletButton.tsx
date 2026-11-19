"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";

import { useHasAgentId } from "@/hooks/useAgent";
import { activeChain } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";

import styles from "./Header.module.css";

/**
 * Connect, switch network, or show the connected address with its Agent ID status.
 * Injected wallets only: no QR or pairing-code login.
 */
export function WalletButton() {
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { hasAgentId } = useHasAgentId(address);

  if (!isConnected || !address) {
    const injected = connectors[0];
    return (
      <button
        type="button"
        className={styles.wallet}
        disabled={!injected || isPending}
        onClick={() => injected && connect({ connector: injected })}
      >
        {isPending ? "Check your wallet…" : "Connect wallet"}
      </button>
    );
  }

  if (chainId !== activeChain.id) {
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

  return (
    <button
      type="button"
      className={styles.wallet}
      onClick={() => disconnect()}
      title="Disconnect"
    >
      {hasAgentId ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8.5l3 3 7-7" stroke="var(--good)" strokeWidth="2.2" />
        </svg>
      ) : null}
      <span>{hasAgentId ? "Agent ID" : "No Agent ID"}</span>
      <span className={styles.address}>{shortAddress(address)}</span>
    </button>
  );
}
