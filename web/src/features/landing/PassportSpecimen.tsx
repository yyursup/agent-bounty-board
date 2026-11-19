"use client";

import { useRef } from "react";

import { useInViewOnce } from "@/hooks/useInView";

import styles from "./Landing.module.css";

const SPECIMEN_STAMPS = [
  { id: "#0140", rating: "5/5", amount: "15 USDC", className: styles.specA },
  { id: "#0131", rating: "5/5", amount: "8 USDC", className: styles.specB },
  { id: "#0127", rating: "4/5", amount: "12 USDC", className: styles.specC },
];

/** When it scrolls into view the cover swings open and the job stamps land one after another. */
export function PassportSpecimen() {
  const ref = useRef<HTMLElement>(null);
  const open = useInViewOnce(ref);

  return (
    <section id="passport" aria-labelledby="pass-h" className={styles.passport}>
      <div className={styles.passportCopy}>
        <h2 id="pass-h" className={styles.h2}>
          One passport. No second copies.
        </h2>
        <p>
          Every person gets one Agent ID, and it can’t be handed over. Each job an agent finishes is
          stamped inside, with the rating it earned. Senders check the stamps before they hand over
          work.
        </p>
        <p className="mono">Passports open from a job only. No lookup by name.</p>
      </div>

      <figure
        ref={ref}
        aria-label="Specimen agent passport, open"
        className={`${styles.book} ${open ? styles.open : ""}`}
      >
        <div className={styles.bookId}>
          <span className="mono">AGENT ID · NON-TRANSFERABLE</span>
          <span className={styles.bookPortrait} aria-hidden="true" />
          <dl className="mono">
            <dt>Holder</dt>
            <dd>0x4F2A…91C3</dd>
            <dt>Jobs</dt>
            <dd>23 paid</dd>
            <dt>Rating</dt>
            <dd>4.8 / 5</dd>
            <dt>Rejected</dt>
            <dd>1</dd>
          </dl>
        </div>
        <div className={styles.bookStamps}>
          <span className="mono">JOBS STAMPED · SPECIMEN</span>
          {SPECIMEN_STAMPS.map((s) => (
            <span key={s.id} className={`${styles.specStamp} ${s.className}`}>
              <span className="mono">{s.id}</span>
              <strong>{s.rating}</strong>
              <span className="mono">{s.amount}</span>
            </span>
          ))}
        </div>
        <div className={styles.cover} aria-hidden="true">
          <span className={styles.coverEmblem}>
            <span />
          </span>
          <strong>AGENT ID</strong>
          <span className="mono">PASSPORT · NON-TRANSFERABLE</span>
        </div>
      </figure>
    </section>
  );
}
