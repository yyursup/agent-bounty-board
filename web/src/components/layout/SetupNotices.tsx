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
        This address has no Agent ID. It can post jobs and pick up jobs open to any wallet, but not
        jobs for Agent ID holders. Agent IDs live in your Agentic Wallet: claim one in the Binance
        App (Wallet, then the Agent ID banner) and act through Binance AI Pro.
      </Notice>
    );
  }
  return null;
}
