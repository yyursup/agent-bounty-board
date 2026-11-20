"use client";

import { useMemo, useState } from "react";
import { parseUnits } from "viem";

import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_LABEL,
  ATTACHMENT_TYPES,
  SUMMARY_MAX,
  TITLE_MAX,
  type Brief,
  type Category,
} from "@/lib/bounty/brief";

export type BriefMode = "write" | "attach";
export const REVIEW_WINDOWS = [24, 48, 72] as const;

const HOUR = 3600;

/** Three days from now at 18:00 local time, as a datetime-local value. */
function defaultDeadline(): string {
  const d = new Date(Date.now() + 3 * 86_400_000);
  d.setHours(18, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type SendForm = ReturnType<typeof useSendForm>;

/** Everything the sender types, and whether it would be accepted by the contract. */
export function useSendForm(decimals: number, maxReward: bigint | undefined) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Research");
  const [mode, setMode] = useState<BriefMode>("write");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [criteria, setCriteria] = useState<string[]>(["", "", ""]);
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [reviewHours, setReviewHours] = useState<(typeof REVIEW_WINDOWS)[number]>(48);
  /** Agent ID holders only by default; the sender can open the job to any wallet. */
  const [agentIdOnly, setAgentIdOnly] = useState(true);

  const amount = useMemo(() => {
    try {
      const v = parseUnits(reward.trim().replace(",", "."), decimals);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  }, [reward, decimals]);

  const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);

  const problems = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const list: string[] = [];
    if (!title.trim()) list.push("Give the job a title.");
    if (mode === "write" && !text.trim()) list.push("Write the brief, or attach it as a file.");
    if (mode === "attach" && !file) list.push("Attach the brief file.");
    if (mode === "attach" && !summary.trim()) list.push("Add a line for the stamp.");
    if (!amount) list.push("Set a reward above zero.");
    if (amount && maxReward !== undefined && amount > maxReward)
      list.push("That reward is above the board’s limit.");
    if (
      !Number.isFinite(deadlineUnix) ||
      deadlineUnix < now + HOUR ||
      deadlineUnix > now + 30 * 86_400
    ) {
      list.push("Pick a deadline between 1 hour and 30 days from now.");
    }
    return list;
  }, [title, mode, text, file, summary, amount, maxReward, deadlineUnix]);

  const chooseFile = (next: File | null): string | null => {
    if (!next) {
      setFile(null);
      return null;
    }
    const ext = next.name.slice(next.name.lastIndexOf(".")).toLowerCase();
    if (!(ATTACHMENT_TYPES as readonly string[]).includes(ext))
      return "Use a PDF, DOC, DOCX, MD or TXT file.";
    if (next.size > ATTACHMENT_MAX_BYTES) return `The file is larger than ${ATTACHMENT_MAX_LABEL}.`;
    setFile(next);
    return null;
  };

  /** The brief document, given the IPFS URI of the attachment when there is one. */
  const toBrief = (attachmentUri?: string): Brief => ({
    version: 1,
    title: title.trim(),
    category,
    summary: summary.trim() || undefined,
    text: mode === "write" ? text.trim() : undefined,
    attachment:
      mode === "attach" && file && attachmentUri
        ? { uri: attachmentUri, name: file.name, size: file.size, mimeType: file.type }
        : undefined,
    criteria: criteria.map((c) => c.trim()).filter(Boolean),
  });

  return {
    fields: {
      title,
      category,
      mode,
      text,
      summary,
      file,
      criteria,
      reward,
      deadline,
      reviewHours,
      agentIdOnly,
    },
    set: {
      title: (v: string) => setTitle(v.slice(0, TITLE_MAX)),
      category: setCategory,
      mode: setMode,
      text: setText,
      summary: (v: string) => setSummary(v.slice(0, SUMMARY_MAX)),
      file: chooseFile,
      criterion: (i: number, v: string) => setCriteria((c) => c.map((x, j) => (j === i ? v : x))),
      reward: setReward,
      deadline: setDeadline,
      reviewHours: setReviewHours,
      agentIdOnly: setAgentIdOnly,
    },
    amount,
    deadlineUnix,
    reviewSeconds: reviewHours * HOUR,
    problems,
    ready: problems.length === 0,
    toBrief,
  };
}
