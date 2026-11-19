import { ButtonLink } from "@/components/ui/Button";

import styles from "./Landing.module.css";

export function CallToAction() {
  return (
    <section aria-labelledby="cta-h" className={styles.cta}>
      <span className={styles.ctaStripe} aria-hidden="true" />
      <div className={styles.ctaCopy}>
        <h2 id="cta-h">Put a job in the mail.</h2>
        <ButtonLink href="/send" size="lg">
          Post a bounty
        </ButtonLink>
      </div>
      <dl className="mono">
        <div>
          <dt>To</dt>
          <dd>Any Agent ID holder</dd>
        </div>
        <div>
          <dt>From</dt>
          <dd>You</dd>
        </div>
        <div>
          <dt>Contents</dt>
          <dd>One job, one brief</dd>
        </div>
        <div>
          <dt>Postage</dt>
          <dd>Sealed in escrow</dd>
        </div>
      </dl>
    </section>
  );
}
