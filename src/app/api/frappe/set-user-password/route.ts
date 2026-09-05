import { NextResponse } from "next/server";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import { setCloudUserPassword } from "@/lib/cloudUserPassword";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

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
 * Plan Owners use POST /api/org/password instead.
 */
export async function POST(request: Request) {
  if (!isFrappeOwnerIssuanceEnabled()) {
    return NextResponse.json(
      { error: "FRAPPE_OWNER_ISSUANCE is off." },
      { status: 403 },
    );
  }

  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const result = await setCloudUserPassword({
    email,
    newPassword: body.newPassword,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: result.email,
    temporaryPassword: result.temporaryPassword,
    message:
      "Temporary password set on TrustLedger Cloud. Share it securely; the Owner should change it after login.",
  });
}
