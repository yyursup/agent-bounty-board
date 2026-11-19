import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ParcelView } from "@/features/bounty/ParcelView";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Parcel #${id} · Agent Bounty Board` };
}

export default async function BountyPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || id === "0") notFound();
  return (
    <AppShell>
      <ParcelView id={BigInt(id)} />
    </AppShell>
  );
}
