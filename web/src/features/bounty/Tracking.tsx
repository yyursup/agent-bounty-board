import { reviewEndsAt } from "@/lib/bounty/lifecycle";
import { BountyStatus, type Bounty } from "@/lib/bounty/types";
import { formatDateTime, formatRemaining, shortAddress } from "@/lib/format";

import styles from "./Parcel.module.css";

type Stop = { name: string; note: string; done: boolean };

function stops(b: Bounty, now: number): Stop[] {
  const s = b.status;
  const returned = s === BountyStatus.Refunded;
  return [
    { name: "Posted", note: "Postage sealed in escrow by the sender.", done: true },
    {
      name: "Picked up",
      note:
        s >= BountyStatus.Claimed && !returned
          ? `Carried by ${shortAddress(b.agent)}.`
          : b.agentIdOnly
            ? "Waiting for an agent with an Agent ID."
            : "Waiting for a carrier. Open to any wallet.",
      done: s >= BountyStatus.Claimed && !returned,
    },
    {
      name: "Delivered",
      note:
        s === BountyStatus.Submitted
          ? `Review window closes ${formatDateTime(reviewEndsAt(b))} (${formatRemaining(reviewEndsAt(b), now)} left).`
          : "The result is filed and the review window opens.",
      done: s >= BountyStatus.Submitted && !returned,
    },
    returned
      ? {
          name: "Returned",
          note: "Nothing was delivered, so the sender took the postage back.",
          done: true,
        }
      : {
          name: "Settled",
          note:
            s === BountyStatus.Paid
              ? `${b.paidBps / 100}% of the postage paid to the carrier, rating stamped in their passport.`
              : "The sender grades the work and pays a share, never below the floor.",
          done: s === BountyStatus.Paid,
        },
  ];
}

/** The parcel's route. The line between two stops draws itself when the second one is reached. */
export function Tracking({ bounty, now }: { bounty: Bounty; now: number }) {
  const list = stops(bounty, now);
  const current = list.findIndex((s) => !s.done);
  return (
    <section aria-labelledby="track-h" className={styles.section}>
      <h2 id="track-h" className={styles.h2}>
        Tracking
      </h2>
      <ol className={styles.track}>
        {list.map((stop, i) => {
          const next = list[i + 1];
          return (
            <li
              key={stop.name}
              aria-current={i === current ? "step" : undefined}
              className={styles.stop}
            >
              {next && (
                <>
                  <span className={styles.rail} aria-hidden="true" />
                  <span
                    className={`${styles.fill} ${next.done ? styles.fillOn : ""}`}
                    aria-hidden="true"
                  />
                </>
              )}
              <span
                aria-hidden="true"
                className={`${styles.dot} ${stop.done ? styles.dotDone : i === current ? styles.dotNow : ""}`}
              />
              <span className={styles.stopText}>
                <strong>{stop.name}</strong>
                <span>{stop.note}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
