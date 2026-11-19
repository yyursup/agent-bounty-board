import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  canApprove,
  canCancel,
  canClaim,
  canReject,
  canRelease,
  canSubmit,
  reviewEndsAt,
} from "./lifecycle";
import { BountyStatus, type Bounty } from "./types";

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

  it("opens approve to the poster, and reject only inside the window", () => {
    expect(reviewEndsAt(submitted)).toBe(600);
    expect(canApprove(submitted, poster)).toBe(true);
    expect(canReject(submitted, poster, 599)).toBe(true);
    expect(canReject(submitted, poster, 600)).toBe(false);
    expect(canApprove(submitted, agent)).toBe(false);
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
