"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getAddress, isAddress, type Address } from "viem";
import { useAccount } from "wagmi";

/**
 * Who the visitor is, without any login. A connected wallet can sign; a pasted address can only
 * be viewed (its owner acts through their agent). The pasted address lives in this browser only.
 */

const KEY = "abb:viewing-address";
const listeners = new Set<() => void>();

function read(): Address | undefined {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && isAddress(v) ? getAddress(v) : undefined;
  } catch {
    return undefined;
  }
}

function write(value: Address | undefined) {
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage can be unavailable (private mode); the address then lasts for this page only.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export type Identity = {
  /** The address the screens are about, connected or pasted. */
  address: Address | undefined;
  mode: "wallet" | "viewing" | "none";
  /** True only with a connected wallet, which can send transactions from this page. */
  canSign: boolean;
};

export function useViewingAddress() {
  const viewing = useSyncExternalStore(subscribe, read, () => undefined);
  const set = useCallback((value: string | undefined) => {
    write(value && isAddress(value) ? getAddress(value) : undefined);
  }, []);
  return [viewing, set] as const;
}

export function useIdentity(): Identity {
  const { address: wallet } = useAccount();
  const [viewing] = useViewingAddress();
  if (wallet) return { address: wallet, mode: "wallet", canSign: true };
  if (viewing) return { address: viewing, mode: "viewing", canSign: false };
  return { address: undefined, mode: "none", canSign: false };
}
