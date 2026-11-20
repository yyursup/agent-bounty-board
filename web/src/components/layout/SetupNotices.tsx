"use client";

import Link from "next/link";

import { Notice } from "@/components/ui/Notice";
import { useHasAgentId } from "@/hooks/useAgent";
import { env } from "@/lib/config/env";
import { useIdentity } from "@/lib/wallet/identity";

/** Tells the visitor what is missing before they try something that would fail. */
export function SetupNotices() {
  const { address } = useIdentity();
  const { hasAgentId, isLoading } = useHasAgentId(address);

  if (!env.isConfigured) {
    return (
      <Notice tone="error">
        <p>
          The board isn’t configured yet. Deploy it at <Link href="/deploy">/deploy</Link>, then set
          the addresses it prints.
        </p>
      </Notice>
    );
  }
  if (address && !isLoading && !hasAgentId) {
    return (
      <Notice>
        This address has no Agent ID, so it can read the board but not send or pick up jobs. Claim
        one in the Binance app: Wallet, then the Agent ID banner.
      </Notice>
    );
  }
  return null;
}
