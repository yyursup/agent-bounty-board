import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAddress, isAddress } from "viem";

import { AppShell } from "@/components/layout/AppShell";
import { PassportView } from "@/features/passport/PassportView";

type Props = {
  params: Promise<{ address: string }>;
  searchParams: Promise<{ from?: string }>;
};

export const metadata: Metadata = { title: "Passport · Agent Bounty Board" };

export default async function PassportPage({ params, searchParams }: Props) {
  const { address } = await params;
  const { from } = await searchParams;
  if (!isAddress(address)) notFound();
  return (
    <AppShell>
      <PassportView
        address={getAddress(address)}
        fromBounty={from && /^\d+$/.test(from) ? from : undefined}
      />
    </AppShell>
  );
}
