import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  canCancel,
  canClaim,
  canRelease,
  canSettle,
  canSubmit,
  payoutTiers,
  ratingForPayout,
  reviewEndsAt,
} from "./lifecycle";
import { BountyStatus, splitReward, type Bounty } from "./types";

const poster = "0x00000000000000000000000000000000000000a1" as const;
const agent = "0x00000000000000000000000000000000000000b2" as const;
const stranger = "0x00000000000000000000000000000000000000c3" as const;

const base: Bounty = {
  id: 1n,
  poster,
  reward: 12n,
  agent: zeroAddress,
  deadline: 1_000,
  submittedAt: 0,
  reviewWindow: 100,
  status: BountyStatus.Open,
  agentIdOnly: true,
  floorBps: 2_000,
  paidBps: 0,
  briefURI: "ipfs://brief",
  resultURI: "",
};
const claimed: Bounty = { ...base, agent, status: BountyStatus.Claimed };
const submitted: Bounty = { ...claimed, status: BountyStatus.Submitted, submittedAt: 500 };

describe("lifecycle mirrors the contract", () => {
  it("lets anyone but the poster claim an open job before the deadline", () => {
    expect(canClaim(base, agent, 999)).toBe(true);
    expect(canClaim(base, poster, 999)).toBe(false);
    expect(canClaim(base, agent, 1_000)).toBe(false);
    expect(canClaim(base, undefined, 0)).toBe(false);
  });

  it("lets only the carrier submit, up to and including the deadline", () => {
    expect(canSubmit(claimed, agent, 1_000)).toBe(true);
    expect(canSubmit(claimed, agent, 1_001)).toBe(false);
    expect(canSubmit(claimed, stranger, 10)).toBe(false);
  });

  it("lets only the poster settle, and only inside the review window", () => {
    expect(reviewEndsAt(submitted)).toBe(600);
    expect(canSettle(submitted, poster, 599)).toBe(true);
    expect(canSettle(submitted, poster, 600)).toBe(false);
    expect(canSettle(submitted, agent, 500)).toBe(false);
    expect(canSettle(claimed, poster, 500)).toBe(false);
  });

  it("lets the carrier release once the window has closed", () => {
    expect(canRelease(submitted, agent, 599)).toBe(false);
    expect(canRelease(submitted, agent, 600)).toBe(true);
    expect(canRelease(submitted, poster, 700)).toBe(false);
  });

  it("refunds open jobs any time and claimed ones after a missed deadline", () => {
    expect(canCancel(base, poster, 0)).toBe(true);
    expect(canCancel(claimed, poster, 1_000)).toBe(false);
    expect(canCancel(claimed, poster, 1_001)).toBe(true);
    expect(canCancel(submitted, poster, 9_999)).toBe(false);
    expect(canCancel(base, stranger, 0)).toBe(false);
  });
});

describe("payouts", () => {
  it("offers the floor and the usual steps above it", () => {
    expect(payoutTiers(2_000)).toEqual([2_000, 4_000, 6_000, 8_000, 10_000]);
    expect(payoutTiers(4_000)).toEqual([4_000, 6_000, 8_000, 10_000]);
    expect(payoutTiers(4_500)).toEqual([4_500, 6_000, 8_000, 10_000]);
    expect(payoutTiers(0)).toEqual([0, 4_000, 6_000, 8_000, 10_000]);
  });

  it("pairs each share with a rating", () => {
    expect([0, 2_000, 4_000, 6_000, 8_000, 10_000].map(ratingForPayout)).toEqual([
      1, 1, 2, 3, 4, 5,
    ]);
  });

  it("splits the reward the way the contract rounds", () => {
    expect(splitReward(12n, 6_000)).toEqual({ toAgent: 7n, toPoster: 5n });
    expect(splitReward(100n * 10n ** 18n, 2_000)).toEqual({
      toAgent: 20n * 10n ** 18n,
      toPoster: 80n * 10n ** 18n,
    });
  });
});
