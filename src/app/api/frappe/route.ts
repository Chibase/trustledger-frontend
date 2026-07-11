import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FRAPPE_SID_COOKIE } from "@/lib/auth.constants";
import { frappeCallWithSid } from "@/lib/frappeServer";

/**
 * Same-origin proxy so the browser never needs the Frappe sid cookie.
 * POST body: { method: "/api/method/...", ...args }
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Not logged in to live session" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const method = body.method;
  if (typeof method !== "string" || !method.includes("/api/method/")) {
    return NextResponse.json(
      { error: "body.method must be a /api/method/... path" },
      { status: 400 },
    );
  }

  const { method: _method, ...args } = body;
  try {
    const message = await frappeCallWithSid(sid, method, args);
    return NextResponse.json({ message });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Proxy failed";
    const status = text.includes("(401)") || text.includes("(403)") ? 401 : 502;
    return NextResponse.json({ error: text }, { status });
  }
}
