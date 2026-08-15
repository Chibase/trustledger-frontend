import { NextResponse } from "next/server";
import { resourcePackById } from "@/data/resources";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { readResourceDownloadGrant } from "@/lib/resourceAccess";
import { buildResourcePackPdf } from "@/lib/resourceDocument";

export const runtime = "nodejs";

/** Stream a gated resource pack as a PDF attachment. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || undefined;
  const inline = url.searchParams.get("view") === "1";

  const ip = clientIp(request);
  if (!rateLimitAllow(`resource-file:${ip}`, 40, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Wait a few minutes." },
      { status: 429 },
    );
  }

  let grant;
  try {
    grant = readResourceDownloadGrant(token);
  } catch (err) {
    console.error("[resources/file] token secret missing", err);
    return NextResponse.json(
      { error: "Download unlock is misconfigured." },
      { status: 503 },
    );
  }

  if (!grant) {
    return NextResponse.json(
      { error: "Download link expired or invalid. Request the pack again." },
      { status: 401 },
    );
  }

  const pack = resourcePackById(grant.packId);
  if (!pack) {
    return NextResponse.json({ error: "Unknown resource pack." }, { status: 404 });
  }

  const pdf = await buildResourcePackPdf(pack);
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Cache-Control": "no-store",
  });
  const disposition = inline ? "inline" : "attachment";
  headers.set(
    "Content-Disposition",
    `${disposition}; filename="${pack.filename}"`,
  );

  return new NextResponse(new Uint8Array(pdf), { status: 200, headers });
}
