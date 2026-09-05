import { NextResponse } from "next/server";
import { ensureTrustLedgerCustomFields } from "@/lib/frappeCustomFields";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  /** Default true — reports missing fields without writing. */
  dryRun?: boolean;
};

/**
 * OD-1 — ensure Customer/User custom fields on Frappe Desk via API.
 * Platform Operator + FRAPPE_OWNER_ISSUANCE=1.
 */
export async function POST(request: Request) {
  if (!isFrappeOwnerIssuanceEnabled()) {
    return NextResponse.json(
      {
        error:
          "FRAPPE_OWNER_ISSUANCE is off. Enable on Vercel for operator Step 1 tools.",
      },
      { status: 403 },
    );
  }

  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session);

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const dryRun = body.dryRun !== false;
  const result = await ensureTrustLedgerCustomFields({ dryRun });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
