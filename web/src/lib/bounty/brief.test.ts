import { describe, expect, it } from "vitest";

import { parseBrief } from "./brief";

describe("parseBrief", () => {
  it("accepts a written brief", () => {
    const brief = parseBrief({
      version: 1,
      title: "Summarize",
      category: "Research",
      text: "Read it",
      criteria: ["Short", 4],
    });
    expect(brief).toMatchObject({
      title: "Summarize",
      category: "Research",
      text: "Read it",
      criteria: ["Short"],
    });
  });

  it("accepts an attached brief", () => {
    const brief = parseBrief({
      version: 1,
      title: "Guide",
      category: "Writing",
      summary: "One line",
      attachment: { uri: "ipfs://x", name: "brief.pdf", size: 10, mimeType: "application/pdf" },
    });
    expect(brief?.attachment?.name).toBe("brief.pdf");
  });

  it("rejects anything that isn't a brief", () => {
    expect(parseBrief(null)).toBeNull();
    expect(parseBrief({ version: 2, title: "x", category: "Research" })).toBeNull();
    expect(parseBrief({ version: 1, title: "x", category: "Gossip" })).toBeNull();
  });

  it("truncates an oversized title", () => {
    expect(
      parseBrief({ version: 1, title: "x".repeat(200), category: "Data" })?.title,
    ).toHaveLength(60);
  });
});
