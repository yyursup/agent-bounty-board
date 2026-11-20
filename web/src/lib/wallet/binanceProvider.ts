import type { EIP1193Provider } from "viem";

type Flagged = EIP1193Provider & {
  isBinance?: boolean;
  isBinanceWallet?: boolean;
  providers?: Flagged[];
};

declare global {
  interface Window {
    binancew3w?: { ethereum?: Flagged };
  }
}

/**
 * The provider to talk to. Inside the Binance App's browser, Binance Wallet exposes
 * `window.binancew3w.ethereum`; with several extensions installed, `window.ethereum` may belong to
 * any of them. Prefer Binance Wallet, then fall back to whatever is injected.
 */
export function pickBinanceFirstProvider(): EIP1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  const injected = (window as Window & { ethereum?: Flagged }).ethereum;
  const candidates: Flagged[] = [];
  if (window.binancew3w?.ethereum) candidates.push(window.binancew3w.ethereum);
  if (injected?.providers) candidates.push(...injected.providers);
  if (injected) candidates.push(injected);
  return candidates.find((p) => p.isBinance || p.isBinanceWallet) ?? injected ?? candidates[0];
}
