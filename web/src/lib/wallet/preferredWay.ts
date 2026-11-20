"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Which way the visitor likes to act: sign here with a wallet, or hand a prompt to their agent. */
export type Way = "wallet" | "agent";

const KEY = "abb:preferred-way";
const listeners = new Set<() => void>();

function read(): Way | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "wallet" || v === "agent" ? v : null;
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The remembered choice, or `fallback` until the visitor picks one. */
export function usePreferredWay(fallback: Way) {
  const stored = useSyncExternalStore(subscribe, read, () => null);
  const set = useCallback((way: Way) => {
    try {
      window.localStorage.setItem(KEY, way);
    } catch {
      // Without storage the choice simply isn't remembered.
    }
    listeners.forEach((l) => l());
  }, []);
  return [stored ?? fallback, set] as const;
}
