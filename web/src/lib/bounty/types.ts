import type { Address } from "viem";

/** Mirrors `IBountyBoard.Status`. The numeric values are the on-chain enum. */
export const BountyStatus = {
  None: 0,
  Open: 1,
  Claimed: 2,
  Submitted: 3,
  Paid: 4,
  Refunded: 5,
} as const;
export type BountyStatus = (typeof BountyStatus)[keyof typeof BountyStatus];

export type Bounty = {
  id: bigint;
  poster: Address;
  reward: bigint;
  agent: Address;
  /** Unix seconds. */
  deadline: number;
  /** Unix seconds, 0 until work is submitted. */
  submittedAt: number;
  /** Seconds. */
  reviewWindow: number;
  status: BountyStatus;
  briefURI: string;
  resultURI: string;
};

/** Mirrors `IBountyBoard.Record`: reputation tied to an address. */
export type AgentRecord = {
  paid: number;
  rated: number;
  ratingSum: number;
  rejected: number;
  timeoutReleases: number;
  missedDeadlines: number;
  earned: bigint;
};

/** Shape returned by viem for `getBounty`. */
type RawBounty = {
  poster: Address;
  reward: bigint;
  agent: Address;
  deadline: number;
  submittedAt: number;
  reviewWindow: number;
  status: number;
  briefURI: string;
  resultURI: string;
};

export function toBounty(id: bigint, raw: RawBounty): Bounty {
  return { id, ...raw, status: raw.status as BountyStatus };
}

export function averageRating(record: AgentRecord): number | null {
  return record.rated === 0 ? null : record.ratingSum / record.rated;
}
