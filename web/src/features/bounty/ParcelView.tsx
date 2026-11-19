"use client";

import Link from "next/link";
import { useAccount } from "wagmi";

import { Notice } from "@/components/ui/Notice";
import { useBounty } from "@/hooks/useBounties";
import { useBrief } from "@/hooks/useBrief";
import { useNow } from "@/hooks/useNow";
import { useRewardToken } from "@/hooks/useRewardToken";
import { toGatewayUrl } from "@/lib/ipfs";

import { BriefSection } from "./BriefSection";
import { ParcelActions } from "./ParcelActions";
import { PostagePanel } from "./PostagePanel";
import styles from "./Parcel.module.css";
import { ShippingLabel } from "./ShippingLabel";
import { Tracking } from "./Tracking";

/** One job: its label, where it is on the route, what's inside, and what you can do with it. */
export function ParcelView({ id }: { id: bigint }) {
  const { bounty, isLoading, error } = useBounty(id);
  const brief = useBrief(bounty?.briefURI);
  const { decimals, symbol } = useRewardToken();
  const { address } = useAccount();
  const now = useNow();

  if (isLoading) return <p className={styles.loading}>Finding parcel #{String(id)}…</p>;
  if (error || !bounty) {
    return <Notice tone="error">Parcel #{String(id)} doesn’t exist on this board.</Notice>;
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className={styles.crumbs}>
        <Link href="/board">Mail room</Link>
        <span aria-hidden="true">/</span>
        <span>Parcel #{String(id)}</span>
      </nav>

      <div className={styles.layout}>
        <article className={styles.main}>
          <ShippingLabel bounty={bounty} brief={brief.data} />
          <Tracking bounty={bounty} now={now} />
          <BriefSection brief={brief.data} failed={brief.isError || brief.data === null} />
          {bounty.resultURI && <ResultLink uri={bounty.resultURI} />}
        </article>

        <aside aria-label="Postage and actions" className={styles.side}>
          <PostagePanel bounty={bounty} decimals={decimals} symbol={symbol}>
            <ParcelActions bounty={bounty} me={address} now={now} />
          </PostagePanel>
        </aside>
      </div>
    </>
  );
}

function ResultLink({ uri }: { uri: string }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Delivered work</h2>
      <a className="mono" href={toGatewayUrl(uri)} target="_blank" rel="noreferrer">
        {uri} ↗
      </a>
    </section>
  );
}
