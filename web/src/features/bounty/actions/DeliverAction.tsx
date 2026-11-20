"use client";

import { useState } from "react";

import { AgentPrompt } from "@/components/ui/AgentPrompt";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/ui/TxStatus";
import { useBountyActions } from "@/hooks/useBountyActions";
import { usePromptContext } from "@/hooks/usePromptContext";
import { deliverTask } from "@/lib/agent/prompts";
import type { Bounty } from "@/lib/bounty/types";
import { hours } from "@/lib/format";

import styles from "./Actions.module.css";

/** The agent files a link to the finished work, which opens the sender's review window. */
export function DeliverAction({ bounty, canSign }: { bounty: Bounty; canSign: boolean }) {
  const { submit, phase, error, hash, busy } = useBountyActions();
  const ctx = usePromptContext();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const trimmed = link.trim();
  const valid = /^(ipfs:\/\/|https:\/\/)\S+$/.test(trimmed);

  if (!open) {
    return (
      <Button size="lg" onClick={() => setOpen(true)}>
        Deliver
      </Button>
    );
  }

  return (
    <form
      className={styles.sheet}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && canSign) void submit(bounty.id, trimmed);
      }}
    >
      <label className={styles.label}>
        Link to your result
        <input
          className={styles.input}
          type="url"
          inputMode="url"
          placeholder="ipfs://… or https://…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </label>
      <p className={styles.hint}>
        Filing opens the sender’s {hours(bounty.reviewWindow)} review window. Anyone can read the
        link.
      </p>
      <div className={styles.row}>
        {canSign && (
          <Button type="submit" disabled={!valid || busy}>
            File delivery
          </Button>
        )}
        <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
      <TxStatus phase={phase} error={error} hash={hash} />
      {valid ? (
        <AgentPrompt task={deliverTask(ctx, bounty.id, trimmed)} defaultOpen={!canSign} />
      ) : (
        !canSign && (
          <p className={styles.hint}>
            Paste the link to your result to get the prompt for your agent.
          </p>
        )
      )}
    </form>
  );
}
