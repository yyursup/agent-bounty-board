"use client";

import { canApprove, canCancel, canClaim, canRelease, canSubmit } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";
import type { Identity } from "@/lib/wallet/identity";

import { ClaimAction } from "./actions/ClaimAction";
import { DeliverAction } from "./actions/DeliverAction";
import { RefundAction } from "./actions/RefundAction";
import { ReleaseAction } from "./actions/ReleaseAction";
import { SignAction } from "./actions/SignAction";
import styles from "./Parcel.module.css";

/**
 * Shows only the actions the contract would accept from this visitor right now. With a connected
 * wallet they can act here; otherwise each action comes as a prompt for their agent.
 */
export function ParcelActions({
  bounty,
  who,
  now,
}: {
  bounty: Bounty;
  who: Identity;
  now: number;
}) {
  const me = who.address;
  const canSign = who.canSign;

  // Nobody identified yet: an open job can still be picked up by an agent through a prompt.
  if (!me) {
    if (bounty.status === BountyStatus.Open && now < bounty.deadline) {
      return <ClaimAction bounty={bounty} canSign={false} />;
    }
    return <p className={styles.muted}>{idleMessage(bounty)}</p>;
  }

  if (canClaim(bounty, me, now)) return <ClaimAction bounty={bounty} canSign={canSign} />;
  if (canSubmit(bounty, me, now)) return <DeliverAction bounty={bounty} canSign={canSign} />;
  if (canRelease(bounty, me, now)) {
    return <ReleaseAction bounty={bounty} label="Release payment" canSign={canSign} />;
  }
  if (canApprove(bounty, me))
    return <SignAction bounty={bounty} me={me} now={now} canSign={canSign} />;
  if (canCancel(bounty, me, now)) return <RefundAction bounty={bounty} canSign={canSign} />;

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
