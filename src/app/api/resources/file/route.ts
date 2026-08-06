import { NextResponse } from "next/server";
import { resourcePackById } from "@/data/resources";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { readResourceDownloadGrant } from "@/lib/resourceAccess";
import { buildResourcePackHtml } from "@/lib/resourceDocument";

/** Stream a gated resource pack as a downloadable HTML attachment. */
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

  const html = buildResourcePackHtml(pack);
  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  if (inline) {
    headers.set("Content-Disposition", `inline; filename="${pack.filename}"`);
  } else {
    headers.set(
      "Content-Disposition",
      `attachment; filename="${pack.filename}"`,
    );
  }

  return new NextResponse(html, { status: 200, headers });
}
