import { NextResponse } from "next/server";

import { ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPES, parseBrief } from "@/lib/bounty/brief";

/**
 * Pins a brief (JSON) or a brief attachment (file) to IPFS through Pinata.
 * The Pinata JWT stays on the server. Everything pinned here is public.
 */

const PINATA = "https://api.pinata.cloud/pinning";

export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "Pinning isn’t configured on this server." },
      { status: 501 },
    );
  }

  const form = await request.formData();
  const json = form.get("json");
  const file = form.get("file");

  try {
    if (typeof json === "string") return await pinJson(json, jwt);
    if (file instanceof File) return await pinUpload(file, jwt);
  } catch {
    return NextResponse.json({ error: "IPFS pinning failed. Try again." }, { status: 502 });
  }
  return NextResponse.json({ error: "Send a brief or a file." }, { status: 400 });
}

async function pinJson(raw: string, jwt: string) {
  const brief = parseBrief(JSON.parse(raw));
  if (!brief) return NextResponse.json({ error: "That isn’t a valid brief." }, { status: 400 });

  const res = await fetch(`${PINATA}/pinJSONToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      pinataContent: brief,
      pinataMetadata: { name: `brief:${brief.title}` },
    }),
  });
  return toResponse(res);
}

async function pinUpload(file: File, jwt: string) {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!(ATTACHMENT_TYPES as readonly string[]).includes(ext)) {
    return NextResponse.json({ error: "Use a PDF, DOC, DOCX, MD or TXT file." }, { status: 400 });
  }
  if (file.size > ATTACHMENT_MAX_BYTES) {
    return NextResponse.json({ error: "The file is larger than 10 MB." }, { status: 413 });
  }

  const body = new FormData();
  body.set("file", file, file.name);
  const res = await fetch(`${PINATA}/pinFileToIPFS`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });
  return toResponse(res);
}

async function toResponse(res: Response) {
  if (!res.ok) throw new Error(`Pinata ${res.status}`);
  const { IpfsHash } = (await res.json()) as { IpfsHash: string };
  return NextResponse.json({ uri: `ipfs://${IpfsHash}` });
}
