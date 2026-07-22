import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { mintReadablePassword } from "@/lib/tempPassword";
import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  /** Optional — if omitted, a temporary password is minted and returned once. */
  newPassword?: string;
};

/**
 * Ops-only: set a temporary password on a Frappe User (Step 1 smoke / support).
 * Requires Platform Operator + FRAPPE_OWNER_ISSUANCE + API keys.
 */
export async function POST(request: Request) {
  if (!isFrappeOwnerIssuanceEnabled()) {
    return NextResponse.json(
      { error: "FRAPPE_OWNER_ISSUANCE is off." },
      { status: 403 },
    );
  }

  const jar = await cookies();
  const operatorEmail = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertLiveOperatorAccess(operatorEmail);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const password =
    (body.newPassword || "").trim().length >= 8
      ? body.newPassword!.trim()
      : mintReadablePassword();

  const pair = frappeKeyPair();
  const base = frappeBase();
  if (!pair || !base) {
    return NextResponse.json(
      { error: "FRAPPE_API_KEY / SECRET / BASE_URL missing" },
      { status: 503 },
    );
  }

  const encoded = encodeURIComponent(email);
  try {
    const res = await fetch(`${base}/api/resource/User/${encoded}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ new_password: password }),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Could not set password (${res.status}): ${text.slice(0, 280)}`,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      email,
      temporaryPassword: password,
      message:
        "Temporary password set on TrustLedger Cloud. Share it securely; the Owner should change it after login.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Password update failed",
      },
      { status: 502 },
    );
  }
}
