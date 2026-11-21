import type { Brief } from "@/lib/bounty/brief";
import { formatBytes } from "@/lib/format";
import { toGatewayUrl } from "@/lib/ipfs";

import styles from "./Parcel.module.css";

export function BriefSection({
  brief,
  failed,
}: {
  brief: Brief | null | undefined;
  failed: boolean;
}) {
  if (failed) {
    return (
      <section className={styles.section}>
        <h2 className={styles.h2}>What’s inside</h2>
        <p className={styles.muted}>
          The brief couldn’t be loaded from IPFS. Try again in a moment.
        </p>
      </section>
    );
  }
  if (!brief) return null;

  return (
    <>
      <section aria-labelledby="brief-h" className={styles.section}>
        <h2 id="brief-h" className={styles.h2}>
          What’s inside
        </h2>
        {brief.summary && <p className={styles.summary}>{brief.summary}</p>}
        {brief.text && <p className={styles.body}>{brief.text}</p>}
        {brief.attachment && (
          <a
            className={styles.file}
            href={toGatewayUrl(brief.attachment.uri)}
            target="_blank"
            rel="noreferrer"
          >
            <span className={styles.fileIcon} aria-hidden="true">
              {brief.attachment.name.split(".").pop()?.toUpperCase().slice(0, 4)}
            </span>
            <span className={styles.fileText}>
              <strong>{brief.attachment.name}</strong>
              <span className="mono">{formatBytes(brief.attachment.size)} · open ↗</span>
            </span>
          </a>
        )}
      </section>

      {brief.criteria.length > 0 && (
        <section aria-labelledby="accept-h" className={styles.section}>
          <h2 id="accept-h" className={styles.h2}>
            Accepted when
          </h2>
          <ol className={styles.criteria}>
            {brief.criteria.map((c, i) => (
              <li key={i}>
                <span aria-hidden="true">{i + 1}</span>
                {c}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
