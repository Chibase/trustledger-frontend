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
  /**
   * Complimentary VIP pilot — full package, entitlement active, no Paystack
   * billing fields (safe for charge-due isolation).
   */
  complimentaryVip?: boolean;
  /** YYYY-MM-DD reminder for 8-week (or custom) complimentary end. */
  complimentaryUntil?: string;
  /** Explicit entitlement when not using complimentaryVip / paystack heuristics. */
  status?: "trial" | "active" | "past_due" | "cancelled";
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
  const complimentaryVip = Boolean(body.complimentaryVip);
  const planId: PlanId = isPlanId(body.planId || "")
    ? (body.planId as PlanId)
    : complimentaryVip
      ? "institutional"
      : "practitioner";
  if (!ownerEmail.includes("@") || !ownerName) {
    return NextResponse.json(
      { error: "ownerEmail and ownerName required" },
      { status: 400 },
    );
  }

  const dryRun = body.dryRun !== false;
  const status =
    complimentaryVip
      ? "active"
      : body.status ||
        (body.paystackReference ? "active" : "trial");
  const orgLabel = complimentaryVip
    ? organization || `${ownerName} pilot`
    : organization || `${ownerName}'s TrustLedger`;

  const customer = buildCustomerDraft({
    organization: complimentaryVip
      ? orgLabel.startsWith("VIP Pilot")
        ? orgLabel
        : `VIP Pilot — ${orgLabel}`
      : orgLabel,
    ownerEmail,
    ownerName,
    planId,
    orgId: body.orgId,
    status,
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
      complimentaryVip,
      complimentaryUntil: body.complimentaryUntil || null,
      customer,
      user,
      checklist,
      message: complimentaryVip
        ? "VIP draft only — set dryRun:false to create complimentary Cloud access (active, no Paystack auth)."
        : "Draft only — set dryRun:false with FRAPPE_API_KEY/SECRET to create on Cloud.",
    });
  }

  const result = await provisionOwnerOnCloud({
    organization: orgLabel,
    ownerEmail,
    ownerName,
    planId,
    orgId: body.orgId,
    status,
    ensureFields: body.ensureFields !== false,
    complimentaryVip,
    complimentaryUntil: body.complimentaryUntil || null,
    billAt: complimentaryVip ? null : undefined,
    authorizationCode: complimentaryVip ? null : undefined,
    planAmountCents: complimentaryVip ? 0 : undefined,
    // Operator shares /login/live + temp password; avoid Frappe welcome clash.
    sendWelcomeEmail: complimentaryVip ? false : undefined,
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
    complimentaryVip,
    complimentaryUntil: body.complimentaryUntil || null,
    skipped: result.skipped || false,
    customerName: result.customerName,
    customer: result.customer,
    user: result.user,
    checklist,
    loginUrl: "/login/live",
    message: complimentaryVip
      ? result.skipped
        ? "VIP Customer + User already on Cloud — refreshed complimentary fields (active, billing cleared)."
        : "VIP complimentary Customer + User created. Set temp password, then share /login/live."
      : result.skipped
        ? "Customer + User already on Cloud — skipped create."
        : "Customer + User created on Frappe Cloud.",
  });
}
