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
/** Floors posters may choose, in basis points, as the board allows today. */
type FloorRange = { min: number; max: number };

export function useSendForm(
  decimals: number,
  maxReward: bigint | undefined,
  floorRange: FloorRange,
) {
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
  /** A free job pays nothing: it's for carriers building a record. Agent ID on both sides. */
  const [free, setFree] = useState(false);
  /** Agent ID holders only by default; the sender can open a paid job to any wallet. */
  const [openToAll, setOpenToAll] = useState(false);
  const agentIdOnly = free || !openToAll;
  /** Least share the agent gets once it delivers, in whole percent. Open and free jobs have none. */
  const [floorPercent, setFloorPercent] = useState("20");
  const floorBps = agentIdOnly && !free ? Math.round(Number(floorPercent) * 100) : 0;

  /** The reward in token units: 0n for a free job, null while the typed amount isn't valid. */
  const amount = useMemo(() => {
    if (free) return 0n;
    try {
      const v = parseUnits(reward.trim().replace(",", "."), decimals);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  }, [reward, decimals, free]);

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
    if (
      agentIdOnly &&
      !free &&
      (!Number.isFinite(floorBps) || floorBps < floorRange.min || floorBps > floorRange.max)
    ) {
      list.push(`Set a floor between ${floorRange.min / 100}% and ${floorRange.max / 100}%.`);
    }
    return list;
  }, [
    title,
    mode,
    text,
    file,
    summary,
    amount,
    maxReward,
    deadlineUnix,
    agentIdOnly,
    free,
    floorBps,
    floorRange,
  ]);

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
      free,
      floorPercent,
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
      agentIdOnly: (v: boolean) => setOpenToAll(!v),
      free: setFree,
      floorPercent: (v: string) => setFloorPercent(v.replace(/[^0-9]/g, "").slice(0, 2)),
    },
    floorBps,
    amount,
    deadlineUnix,
    reviewSeconds: reviewHours * HOUR,
    problems,
    ready: problems.length === 0,
    toBrief,
  };
}
