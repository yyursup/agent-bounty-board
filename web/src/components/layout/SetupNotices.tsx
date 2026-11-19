"use client";

import { useAccount } from "wagmi";

import { Notice } from "@/components/ui/Notice";
import { useHasAgentId } from "@/hooks/useAgent";
import { env } from "@/lib/config/env";

/** Tells the visitor what is missing before they try something that would fail. */
export function SetupNotices() {
  const { address, isConnected } = useAccount();
  const { hasAgentId, isLoading } = useHasAgentId(address);

  if (!env.isConfigured) {
    return (
      <Notice tone="error">
        The board isn’t configured yet. Set the contract addresses in <code>.env.local</code>.
      </Notice>
    );
  }
  if (isConnected && !isLoading && !hasAgentId) {
    return (
      <Notice>
        This wallet has no Agent ID, so it can read the board but not send or pick up jobs. Claim one
        in the Binance app: Wallet, then the Agent ID banner.
      </Notice>
    );
  }
  return null;
}
