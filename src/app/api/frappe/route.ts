import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FRAPPE_SID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { isAllowedFrappeProxyMethod } from "@/lib/frappeProxyAllowlist";
import { frappeCallWithSid } from "@/lib/frappeServer";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import { canonicalLiveEmail } from "@/lib/tenantScope";

/**
 * Same-origin proxy so the browser never needs the Frappe sid cookie.
 * POST body: { method: "/api/method/...", ...args }
 * Methods are tightly allowlisted. Identity comes from the live sid.
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Not logged in to live session" }, { status: 401 });
  }

  const cookieEmail = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const canonical = await canonicalLiveEmail({ sid, cookieEmail });
  if (!canonical.ok) {
    return NextResponse.json(
      { error: canonical.error, code: canonical.code },
      { status: canonical.status },
    );
  }

  const gate = assertLiveOperatorAccess(canonical.email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const method = body.method;
  if (typeof method !== "string" || !isAllowedFrappeProxyMethod(method)) {
    return NextResponse.json(
      {
        error:
          "That TrustLedger Cloud method is not available through this proxy.",
      },
      { status: 403 },
    );
  }

  const args = { ...body };
  delete args.method;
  try {
    const message = await frappeCallWithSid(sid, method.trim(), args);
    return NextResponse.json({ message });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Proxy failed";
    const status = text.includes("(401)") || text.includes("(403)") ? 401 : 502;
    return NextResponse.json({ error: text }, { status });
  }
}
