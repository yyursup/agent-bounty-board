/**
 * The brief is a small JSON document pinned to IPFS; the contract stores only its URI.
 * Either `text` or `attachment` carries the actual instructions.
 */

export const CATEGORIES = ["Research", "Writing", "Translation", "Security", "Data"] as const;
export type Category = (typeof CATEGORIES)[number];

export type BriefAttachment = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
};

export type Brief = {
  version: 1;
  title: string;
  category: Category;
  /** One line shown on the stamp; required when the brief is an attachment. */
  summary?: string;
  text?: string;
  attachment?: BriefAttachment;
  criteria: string[];
};

export const TITLE_MAX = 60;
export const SUMMARY_MAX = 140;
export const ATTACHMENT_TYPES = [".pdf", ".doc", ".docx", ".md", ".txt"] as const;
/** Hosting platforms cap request bodies (Vercel: 4.5 MB), so attachments stay under 4 MB. */
export const ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
export const ATTACHMENT_MAX_LABEL = "4 MB";

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

/** Parses untrusted JSON from IPFS. Returns null when it doesn't look like a brief. */
export function parseBrief(data: unknown): Brief | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.version !== 1 || typeof d.title !== "string" || !isCategory(d.category)) return null;

  const criteria = Array.isArray(d.criteria)
    ? d.criteria.filter((c): c is string => typeof c === "string").slice(0, 10)
    : [];

  const a = d.attachment as Record<string, unknown> | undefined;
  const attachment =
    a && typeof a.uri === "string" && typeof a.name === "string"
      ? {
          uri: a.uri,
          name: a.name,
          size: typeof a.size === "number" ? a.size : 0,
          mimeType: typeof a.mimeType === "string" ? a.mimeType : "",
        }
      : undefined;

  return {
    version: 1,
    title: d.title.slice(0, TITLE_MAX),
    category: d.category,
    summary: typeof d.summary === "string" ? d.summary.slice(0, SUMMARY_MAX) : undefined,
    text: typeof d.text === "string" ? d.text : undefined,
    attachment,
    criteria,
  };
}
