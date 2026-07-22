import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isPlanId, type PlanId } from "@/config/plans";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import { ensureTrustLedgerCustomFields } from "@/lib/frappeCustomFields";
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
 * T5 operator prep — Customer + Plan Owner User drafts.
 * Requires Platform Operator session + FRAPPE_OWNER_ISSUANCE=1.
 * Live create only when dryRun=false and API keys exist.
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

  const pair = frappeKeyPair();
  const base = frappeBase();
  if (!pair || !base) {
    return NextResponse.json(
      {
        error: "FRAPPE_API_KEY / FRAPPE_API_SECRET / FRAPPE_BASE_URL missing",
        customer,
        user,
        checklist,
      },
      { status: 503 },
    );
  }

  const ensureFields = body.ensureFields !== false;
  let fieldsResult: Awaited<ReturnType<typeof ensureTrustLedgerCustomFields>> | null =
    null;
  if (ensureFields) {
    fieldsResult = await ensureTrustLedgerCustomFields({ dryRun: false });
    if (!fieldsResult.ok) {
      return NextResponse.json(
        {
          error:
            "Custom fields ensure failed — fix Desk permissions or create fields manually, then retry.",
          fields: fieldsResult,
          customer,
          user,
          checklist,
        },
        { status: 502 },
      );
    }
  }

  try {
    const customerRes = await fetch(`${base}/api/resource/Customer`, {
      method: "POST",
      headers: {
        Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        customer_name: customer.customer_name,
        customer_type: customer.customer_type,
        territory: customer.territory || "South Africa",
        custom_plan_code: customer.plan_code,
        custom_seat_limit: customer.seat_limit,
        custom_project_limit: customer.project_limit,
        custom_entitlement_status: customer.entitlement_status,
        custom_tl_org_id: customer.tl_org_id,
        custom_owner_email: customer.owner_email,
      }),
    });
    const customerText = await customerRes.text();
    if (!customerRes.ok) {
      return NextResponse.json(
        {
          error: `Customer create failed (${customerRes.status}): ${customerText.slice(0, 300)}`,
          fields: fieldsResult,
          customer,
          user,
        },
        { status: 502 },
      );
    }

    let customerName = customer.customer_name;
    try {
      const parsed = JSON.parse(customerText) as {
        data?: { name?: string };
      };
      if (parsed.data?.name) customerName = parsed.data.name;
    } catch {
      /* keep draft name */
    }

    const userRes = await fetch(`${base}/api/resource/User`, {
      method: "POST",
      headers: {
        Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        send_welcome_email: user.send_welcome_email ? 1 : 0,
        roles: user.roles.map((role) => ({ role })),
        custom_tl_desk_tier: user.tl_desk_tier,
        custom_tl_plan_owner: user.tl_plan_owner,
        custom_tl_customer: customerName,
      }),
    });
    const userText = await userRes.text();
    if (!userRes.ok) {
      return NextResponse.json(
        {
          error: `User create failed (${userRes.status}): ${userText.slice(0, 300)}`,
          customerCreated: true,
          fields: fieldsResult,
          customer,
          user,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      dryRun: false,
      ok: true,
      fields: fieldsResult,
      customer,
      user,
      checklist,
      message:
        "Customer + User created on Frappe Cloud. Keep ADR-013 on until smoke login.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Provision failed",
        fields: fieldsResult,
        customer,
        user,
      },
      { status: 502 },
    );
  }
}
