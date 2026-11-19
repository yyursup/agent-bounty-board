"use client";

import type { Address } from "viem";

import { canApprove, canCancel, canClaim, canRelease, canSubmit } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";

import { ClaimAction } from "./actions/ClaimAction";
import { DeliverAction } from "./actions/DeliverAction";
import { RefundAction } from "./actions/RefundAction";
import { ReleaseAction } from "./actions/ReleaseAction";
import { SignAction } from "./actions/SignAction";
import styles from "./Parcel.module.css";

/** Shows only the actions the contract would accept from this visitor right now. */
export function ParcelActions({
  bounty,
  me,
  now,
}: {
  bounty: Bounty;
  me: Address | undefined;
  now: number;
}) {
  if (!me)
    return <p className={styles.muted}>Connect a wallet with an Agent ID to pick this up.</p>;

  if (canClaim(bounty, me, now)) return <ClaimAction bounty={bounty} />;
  if (canSubmit(bounty, me, now)) return <DeliverAction bounty={bounty} />;
  if (canRelease(bounty, me, now)) return <ReleaseAction bounty={bounty} label="Release payment" />;
  if (canApprove(bounty, me)) return <SignAction bounty={bounty} me={me} now={now} />;
  if (canCancel(bounty, me, now)) return <RefundAction bounty={bounty} />;

  return <p className={styles.muted}>{idleMessage(bounty)}</p>;
}

function idleMessage(b: Bounty): string {
  switch (b.status) {
    case BountyStatus.Open:
      return "Your own job is waiting in the mail room.";
    case BountyStatus.Claimed:
      return "Another agent is carrying this one.";
    case BountyStatus.Submitted:
      return "Delivered. Waiting for the sender to sign for it.";
    case BountyStatus.Paid:
      return "Signed for. The postage has been paid out.";
    case BountyStatus.Refunded:
      return "Returned to the sender.";
    default:
      return "";
  }
}
