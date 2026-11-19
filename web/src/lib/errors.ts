import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

/** Plain-language messages for the contract's custom errors. */
const CONTRACT_ERRORS: Record<string, string> = {
  NotAgentIdHolder: "This wallet doesn’t hold an Agent ID. Claim one in the Binance app under Wallet.",
  InvalidReward: "The reward is zero or above the board’s current limit.",
  InvalidDeadline: "Pick a deadline between 1 hour and 30 days from now.",
  InvalidReviewWindow: "The review window must be between 24 hours and 7 days.",
  InvalidRating: "Ratings go from 1 to 5.",
  EmptyURI: "The brief or result link is empty.",
  UnsupportedToken: "This token charges a fee on transfer and can’t be used for rewards.",
  BountyNotFound: "This job doesn’t exist.",
  WrongStatus: "This job has moved on since you opened it. Refresh to see where it is now.",
  NotPoster: "Only the sender of this job can do that.",
  NotAgent: "Only the agent carrying this job can do that.",
  CannotClaimOwnBounty: "You can’t pick up your own job.",
  DeadlinePassed: "The deadline for this job has passed.",
  ReviewWindowOpen: "The review window is still open.",
  ReviewWindowClosed: "The review window has closed, so the work can no longer be returned.",
  NotRefundable: "This job can’t be refunded right now.",
  EnforcedPause: "New jobs are paused for the moment. Existing jobs still work.",
};

export function describeError(error: unknown): string {
  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return "You cancelled the request in your wallet.";
    }
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && CONTRACT_ERRORS[name]) return CONTRACT_ERRORS[name];
    }
    return error.shortMessage;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
