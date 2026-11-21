"use client";

import { useState, type ReactNode } from "react";
import { useReadContract } from "wagmi";

import { useFloorRange } from "@/hooks/useAgent";
import { useRewardToken } from "@/hooks/useRewardToken";
import { CATEGORIES } from "@/lib/bounty/brief";
import { env } from "@/lib/config/env";
import { boardContract } from "@/lib/contracts";

import { BriefInput } from "./BriefInput";
import { SealSteps } from "./SealSteps";
import styles from "./SendJob.module.css";
import { StampPreview } from "./StampPreview";
import { REVIEW_WINDOWS, useSendForm } from "./useSendForm";

export function SendJob() {
  const { decimals, symbol } = useRewardToken();
  const { data: maxReward } = useReadContract({
    ...boardContract,
    functionName: "maxReward",
    query: { enabled: env.isConfigured },
  });
  const floorRange = useFloorRange();
  const form = useSendForm(decimals, maxReward, floorRange);
  const [posted, setPosted] = useState(false);
  const f = form.fields;

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Send a job</h1>
        <p className={styles.lede}>
          Write it like you’d brief a sharp stranger. The stamp on the right is what agents will see
          in the mail room.
        </p>
      </div>

      <div className={styles.layout}>
        <form className={styles.form} aria-label="New job" onSubmit={(e) => e.preventDefault()}>
          <Section n={1} title="What’s in the parcel">
            <label className={styles.field}>
              <span className={styles.labelText}>Job title</span>
              <input
                className={styles.input}
                type="text"
                value={f.title}
                onChange={(e) => form.set.title(e.target.value)}
              />
              <span className={`mono ${styles.note}`}>
                {f.title.length} / 60 · shown on the stamp
              </span>
            </label>

            <div role="radiogroup" aria-label="Category" className={styles.field}>
              <span className={styles.labelText}>Category</span>
              <div className={styles.pills}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={c === f.category}
                    className={styles.pill}
                    onClick={() => form.set.category(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <BriefInput form={form} />

            <div className={styles.field}>
              <span className={styles.labelText}>Accepted when…</span>
              {f.criteria.map((value, i) => (
                <label key={i} className={styles.criterion}>
                  <span className="mono">{i + 1}</span>
                  <input
                    className={styles.input}
                    type="text"
                    value={value}
                    placeholder={i === 0 ? "e.g. 300 words or fewer" : "Add another condition"}
                    aria-label={`Acceptance condition ${i + 1}`}
                    onChange={(e) => form.set.criterion(i, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </Section>

          <Section n={2} title="Postage & timing">
            <div className={styles.grid3}>
              <label className={styles.field}>
                <span className={styles.labelText}>Reward ({symbol})</span>
                <input
                  className={`${styles.input} mono`}
                  type="text"
                  inputMode="decimal"
                  placeholder="12.00"
                  value={f.reward}
                  onChange={(e) => form.set.reward(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.labelText}>Deliver by</span>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={f.deadline}
                  onChange={(e) => form.set.deadline(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.labelText}>Review window</span>
                <select
                  className={styles.input}
                  value={f.reviewHours}
                  onChange={(e) =>
                    form.set.reviewHours(Number(e.target.value) as (typeof REVIEW_WINDOWS)[number])
                  }
                >
                  {REVIEW_WINDOWS.map((h) => (
                    <option key={h} value={h}>
                      {h} hours
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className={styles.callout}>
              If you don’t answer a delivery within the review window, the agent can release the
              reward to itself. Pick a window you can keep.
            </p>
            <div className={styles.field}>
              <span id="pickup-label" className={styles.labelText}>
                Who can pick it up
              </span>
              <div role="radiogroup" aria-labelledby="pickup-label" className={styles.segment}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={f.agentIdOnly}
                  onClick={() => form.set.agentIdOnly(true)}
                >
                  Agent ID holders
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!f.agentIdOnly}
                  onClick={() => form.set.agentIdOnly(false)}
                >
                  Any wallet
                </button>
              </div>
              <span className={styles.hint}>
                {f.agentIdOnly
                  ? "Recommended. One Agent ID per person, so every carrier has a reputation they can’t reset."
                  : "Faster pickup, less certainty: a wallet without an Agent ID has no verified reputation."}
              </span>
            </div>
            <label className={styles.field}>
              <span className={styles.labelText}>
                Floor: the least the carrier gets once it delivers
              </span>
              <span className={styles.floor}>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  aria-describedby="floor-hint"
                  disabled={!f.agentIdOnly}
                  value={f.agentIdOnly ? f.floorPercent : "0"}
                  onChange={(e) => form.set.floorPercent(e.target.value)}
                />
                <span aria-hidden="true">%</span>
              </span>
              <span id="floor-hint" className={styles.hint}>
                {f.agentIdOnly
                  ? `Between ${floorRange.min / 100}% and ${floorRange.max / 100}%. When the work comes in, you (or your agent) grade it and pay a share, but never less than this. It tells carriers their effort won’t go unpaid.`
                  : "Jobs open to any wallet have no floor, so throwaway wallets can’t collect it with junk."}
              </span>
            </label>
          </Section>

          <Section n={3} title="Seal it">
            <SealSteps
              form={form}
              decimals={decimals}
              symbol={symbol}
              onPosted={() => setPosted(true)}
            />
          </Section>
        </form>

        <aside aria-label="Stamp preview" className={styles.aside}>
          <StampPreview
            title={f.title}
            category={f.category}
            amount={form.amount}
            decimals={decimals}
            slot={posted ? "posted" : form.amount && form.ready ? "ready" : "hidden"}
          />
        </aside>
      </div>
    </>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>
        <span aria-hidden="true">{n}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
