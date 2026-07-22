import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isPlanId, type PlanId } from "@/config/plans";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  buildCustomerDraft,
  buildOwnerUserDraft,
  buildProvisionChecklist,
  isFrappeOwnerIssuanceEnabled,
} from "@/lib/frappeSoT";
import {
  assertLiveOperatorAccess,
  isPlatformOperatorOnly,
  operatorGateMessage,
} from "@/lib/platformOperator";
import { provisionOwnerOnCloud } from "@/lib/provisionOwnerCloud";
import { PLAN_OWNER_DESK_TIER } from "@/types/deskTier";

export const runtime = "nodejs";

type Body = {
  organization?: string;
  ownerEmail?: string;
  ownerName?: string;
  planId?: string;
  orgId?: string;
  paystackReference?: string;
  hasCrmLead?: boolean;
  /** Default true — never creates Cloud docs unless explicitly false. */
  dryRun?: boolean;
  /** On live create, ensure Desk custom fields first (default true). */
  ensureFields?: boolean;
};

/**
 * T5 / OD-3 operator provision — Customer + Plan Owner User.
 * Requires Platform Operator session + FRAPPE_OWNER_ISSUANCE=1.
 */
export async function POST(request: Request) {
  if (!isFrappeOwnerIssuanceEnabled()) {
    return NextResponse.json(
      {
        error:
          "FRAPPE_OWNER_ISSUANCE is off. Enable on Vercel for operator T5 tools only.",
      },
      { status: 403 },
    );
  }

  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertLiveOperatorAccess(email);
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

  const ownerEmail = (body.ownerEmail || "").trim().toLowerCase();
  const ownerName = (body.ownerName || "").trim();
  const organization = (body.organization || "").trim();
  const planId: PlanId = isPlanId(body.planId || "")
    ? (body.planId as PlanId)
    : "practitioner";
  if (!ownerEmail.includes("@") || !ownerName) {
    return NextResponse.json(
      { error: "ownerEmail and ownerName required" },
      { status: 400 },
    );
  }

  const dryRun = body.dryRun !== false;
  const customer = buildCustomerDraft({
    organization: organization || `${ownerName}'s TrustLedger`,
    ownerEmail,
    ownerName,
    planId,
    orgId: body.orgId,
    status: body.paystackReference ? "active" : "trial",
  });
  const user = buildOwnerUserDraft({
    email: ownerEmail,
    fullName: ownerName,
    customerName: customer.customer_name,
    deskTier: PLAN_OWNER_DESK_TIER[planId],
  });

  const checklist = buildProvisionChecklist({
    hasPaystackRef: Boolean(body.paystackReference),
    hasCrmLead: Boolean(body.hasCrmLead),
    customerDraftReady: true,
    issuanceFlagOn: true,
    lockdownOn: isPlatformOperatorOnly(),
  });

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      customer,
      user,
      checklist,
      message:
        "Draft only — set dryRun:false with FRAPPE_API_KEY/SECRET to create on Cloud.",
    });
  }

  const result = await provisionOwnerOnCloud({
    organization: organization || `${ownerName}'s TrustLedger`,
    ownerEmail,
    ownerName,
    planId,
    orgId: body.orgId,
    status: body.paystackReference ? "active" : "trial",
    ensureFields: body.ensureFields !== false,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        detail: result.detail,
        customer: result.customer,
        user: result.user,
        checklist,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    dryRun: false,
    ok: true,
    skipped: result.skipped || false,
    customerName: result.customerName,
    customer: result.customer,
    user: result.user,
    checklist,
    message: result.skipped
      ? "Customer + User already on Cloud — skipped create."
      : "Customer + User created on Frappe Cloud. Keep ADR-013 on until Step 4.",
  });
}
