import type { Address } from "viem";

/**
 * Contracts the board is built on, per chain. Mainnet values are the live USDC and SPACE ID
 * Agent ID contracts; testnet has no official pair, so the deploy page asks for them.
 */
export const KNOWN: Record<56 | 97, { rewardToken?: Address; agentId?: Address }> = {
  56: {
    rewardToken: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    agentId: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  },
  97: {},
};

/** Default per-job cap at deploy time, in whole tokens. The owner can't change it later. */
export const DEFAULT_MAX_REWARD = "1000";
