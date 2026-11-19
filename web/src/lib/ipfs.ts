import { env } from "@/lib/config/env";

import type { Brief } from "./bounty/brief";

/** Turns an `ipfs://` URI into a gateway URL. Other URLs pass through unchanged. */
export function toGatewayUrl(uri: string): string {
  return uri.startsWith("ipfs://") ? `${env.ipfsGateway}${uri.slice("ipfs://".length)}` : uri;
}

type PinResponse = { uri: string } | { error: string };

async function pin(body: FormData): Promise<string> {
  const res = await fetch("/api/pin", { method: "POST", body });
  const data = (await res.json()) as PinResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : `Pinning failed (${res.status}).`);
  }
  return data.uri;
}

export function pinFile(file: File): Promise<string> {
  const body = new FormData();
  body.set("file", file);
  return pin(body);
}

export function pinBrief(brief: Brief): Promise<string> {
  const body = new FormData();
  body.set("json", JSON.stringify(brief));
  return pin(body);
}
