import { NextResponse } from "next/server";
import { SECURITY_HEADERS } from "@/lib/security/headers";

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const { key, value } of SECURITY_HEADERS) {
    response.headers.set(key, value);
  }
  return response;
}

export function blockedProbeResponse(): NextResponse {
  const response = new NextResponse("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
  applySecurityHeaders(response);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

/** Retired WP SEO-spam URL — Gone helps crawlers drop indexed malware faster than 404. */
export function goneWpSpamResponse(): NextResponse {
  const response = new NextResponse("Gone", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
  applySecurityHeaders(response);
  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
