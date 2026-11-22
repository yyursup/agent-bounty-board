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
  /** Only Agent ID holders may pick it up; otherwise any wallet may. */
  agentIdOnly: boolean;
  /** Least share of the reward the agent gets once work is delivered, in basis points. */
  floorBps: number;
  /** Share paid to the agent, in basis points; 0 until paid. */
  paidBps: number;
  briefURI: string;
  resultURI: string;
};

/** Basis points in a whole reward. */
export const FULL_BPS = 10_000;

/** Mirrors `IBountyBoard.Record`: an agent's reputation. */
export type AgentRecord = {
  paid: number;
  rated: number;
  ratingSum: number;
  paidBpsSum: bigint;
  timeoutReleases: number;
  missedDeadlines: number;
  earned: bigint;
  /** Free jobs delivered and closed, rated or released. Kept apart from paid work. */
  freeDone: number;
  freeRated: number;
  freeRatingSum: number;
};

/** Mirrors `IBountyBoard.PosterRecord`: how a poster treats delivered work. */
export type PosterRecord = {
  settled: number;
  paidBpsSum: bigint;
  unanswered: number;
  paidOut: bigint;
  /** Free jobs this poster rated. Not part of `settled`. */
  freeSettled: number;
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
  agentIdOnly: boolean;
  floorBps: number;
  paidBps: number;
  briefURI: string;
  resultURI: string;
};

export function toBounty(id: bigint, raw: RawBounty): Bounty {
  return { id, ...raw, status: raw.status as BountyStatus };
}

/** A free job: reward 0, Agent ID on both sides, rated but never paid. */
export function isFree(b: Pick<Bounty, "reward">): boolean {
  return b.reward === 0n;
}

/** Average rating on free jobs, kept apart from paid work. */
export function averageFreeRating(record: AgentRecord): number | null {
  return record.freeRated === 0 ? null : record.freeRatingSum / record.freeRated;
}

export function averageRating(record: AgentRecord): number | null {
  return record.rated === 0 ? null : record.ratingSum / record.rated;
}

/** Average share an agent was paid, as a percentage, or null before its first payout. */
export function averagePaidPercent(record: AgentRecord): number | null {
  return record.paid === 0 ? null : Number(record.paidBpsSum) / record.paid / 100;
}

/** "85%" or "—": the average share an agent was paid, for display. */
export function paidAverageLabel(record: AgentRecord | undefined): string {
  const avg = record ? averagePaidPercent(record) : null;
  return avg === null ? "—" : `${Math.round(avg)}%`;
}

/** Average share a poster paid on deliveries it settled, as a percentage. */
export function posterAveragePercent(record: PosterRecord): number | null {
  return record.settled === 0 ? null : Number(record.paidBpsSum) / record.settled / 100;
}

/** The agent's and the poster's parts of a reward at `paidBps`, rounded the way the contract does. */
export function splitReward(
  reward: bigint,
  paidBps: number,
): { toAgent: bigint; toPoster: bigint } {
  const toAgent = (reward * BigInt(paidBps)) / BigInt(FULL_BPS);
  return { toAgent, toPoster: reward - toAgent };
}
