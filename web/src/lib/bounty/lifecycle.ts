import { isAddressEqual, zeroAddress, type Address } from "viem";

import { BountyStatus, type Bounty } from "./types";

/**
 * The contract's rules, restated as pure functions so the UI only offers actions that will succeed.
 * Keep in step with contracts/src/BountyBoard.sol.
 */

const same = (a: Address | undefined, b: Address) => !!a && isAddressEqual(a, b);

export function reviewEndsAt(b: Bounty): number {
  return b.submittedAt === 0 ? 0 : b.submittedAt + b.reviewWindow;
}

export function canClaim(b: Bounty, me: Address | undefined, now: number): boolean {
  return b.status === BountyStatus.Open && !!me && !same(me, b.poster) && now < b.deadline;
}

export function canSubmit(b: Bounty, me: Address | undefined, now: number): boolean {
  return b.status === BountyStatus.Claimed && same(me, b.agent) && now <= b.deadline;
}

/** The poster settles a delivery while the review window is open; after that the agent may release. */
export function canSettle(b: Bounty, me: Address | undefined, now: number): boolean {
  return b.status === BountyStatus.Submitted && same(me, b.poster) && now < reviewEndsAt(b);
}

/** Payout tiers offered for a job: the floor, then the usual steps above it. */
export function payoutTiers(floorBps: number): number[] {
  return [...new Set([floorBps, 4_000, 6_000, 8_000, 10_000])]
    .filter((t) => t >= floorBps)
    .sort((a, b) => a - b);
}

/** The rating that goes with a payout share, so one choice sets both. */
export function ratingForPayout(paidBps: number): number {
  if (paidBps >= 10_000) return 5;
  if (paidBps >= 8_000) return 4;
  if (paidBps >= 6_000) return 3;
  if (paidBps >= 4_000) return 2;
  return 1;
}

export function canRelease(b: Bounty, me: Address | undefined, now: number): boolean {
  return b.status === BountyStatus.Submitted && same(me, b.agent) && now >= reviewEndsAt(b);
}

export function canCancel(b: Bounty, me: Address | undefined, now: number): boolean {
  if (!same(me, b.poster)) return false;
  if (b.status === BountyStatus.Open) return true;
  return b.status === BountyStatus.Claimed && now > b.deadline;
}

export function isLive(b: Bounty): boolean {
  return (
    b.status === BountyStatus.Open ||
    b.status === BountyStatus.Claimed ||
    b.status === BountyStatus.Submitted
  );
}

export function hasAgent(b: Bounty): boolean {
  return b.agent !== zeroAddress;
}

/** Postal names for each status, as shown on stamps and tags. */
export const STATUS_LABEL: Record<Bounty["status"], string> = {
  [BountyStatus.None]: "Unknown",
  [BountyStatus.Open]: "Open",
  [BountyStatus.Claimed]: "Picked up",
  [BountyStatus.Submitted]: "Delivered",
  [BountyStatus.Paid]: "Settled",
  [BountyStatus.Refunded]: "Returned",
};
