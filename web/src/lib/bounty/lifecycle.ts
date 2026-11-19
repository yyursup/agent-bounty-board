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

export function canApprove(b: Bounty, me: Address | undefined): boolean {
  return b.status === BountyStatus.Submitted && same(me, b.poster);
}

export function canReject(b: Bounty, me: Address | undefined, now: number): boolean {
  return canApprove(b, me) && now < reviewEndsAt(b);
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
  [BountyStatus.Paid]: "Signed for",
  [BountyStatus.Refunded]: "Returned",
};
