import { formatUnits, type Address } from "viem";

export function shortAddress(address: Address | string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Token amount with two decimals, e.g. 12.00. */
export function formatAmount(value: bigint, decimals: number): string {
  const n = Number(formatUnits(value, decimals));
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Splits an amount into the big whole part and the small tail printed on stamps. */
export function splitAmount(value: bigint, decimals: number): { whole: string; cents: string } {
  const [whole = "0", cents = "00"] = formatAmount(value, decimals).split(".");
  return { whole, cents };
}

/** "2d 14h", "41h 12m", "9m" — the remaining time between now and a Unix timestamp. */
export function formatRemaining(target: number, now: number): string {
  const s = Math.max(0, target - now);
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3_600);
  const m = Math.floor((s % 3_600) / 60);
  if (d > 0) return `${d}d ${String(h).padStart(2, "0")}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

/** "41:12:07" for live countdowns. */
export function formatClock(target: number, now: number): string {
  const s = Math.max(0, target - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function formatDateTime(unix: number): string {
  return new Date(unix * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function hours(seconds: number): string {
  return `${Math.round(seconds / 3600)} hours`;
}
