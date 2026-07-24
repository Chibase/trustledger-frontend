import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { assertOpsAccess } from "@/lib/platformOperator";
import { recordPaystackPayment } from "@/lib/paymentIntel";
import {
  chargePaystackAuthorization,
  paystackConfigured,
} from "@/lib/paystackServer";
import { getPaystackPlan, type PaystackPlanId } from "@/lib/paystackPlans";
import {
  getCustomerEntitlementByOwnerEmail,
  setCustomerEntitlement,
} from "@/lib/entitlementCloud";

export const runtime = "nodejs";

type Body = {
  email?: string;
  authorizationCode?: string;
  planId?: string;
  planLabel?: string;
  amountCents?: number;
  organization?: string;
  name?: string;
  originalReference?: string;
};

/**
 * Ops-only: charge a stored trial authorization after the 14-day trial.
 * Skip if the customer opted out (ops must check CRM / Trial Opt-Out leads).
 */
export async function POST(request: Request) {
  if (!paystackConfigured()) {
    return NextResponse.json(
      { error: "Paystack is not configured" },
      { status: 503 },
    );
  }

  const jar = await cookies();
  const operator = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(operator);
  if (!gate.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const authorizationCode = (body.authorizationCode || "").trim();
  const planId = (body.planId || "").trim() as PaystackPlanId;
  const plan = getPaystackPlan(planId);
  const amountCents = body.amountCents || plan?.amountCents || 0;

  if (!email || !authorizationCode || !amountCents) {
    return NextResponse.json(
      {
        error:
          "email, authorizationCode, and amountCents (or valid planId) are required",
      },
      { status: 400 },
    );
  }

  const reference = `tl_due_${planId || "plan"}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  try {
    const charged = await chargePaystackAuthorization({
      authorizationCode,
      email,
      amountCents,
      reference,
      metadata: {
        checkout_mode: "trial_due",
        plan: planId,
        plan_label: body.planLabel || plan?.label || planId,
        original_reference: body.originalReference || "",
        product: "TrustLedger",
      },
    });

    if (charged.ok) {
      await recordPaystackPayment({
        email,
        name: body.name,
        organization: body.organization,
        planId,
        planLabel: body.planLabel || plan?.label,
        amountCents: charged.amountCents,
        currency: "ZAR",
        reference: charged.reference,
        paidAt: new Date().toISOString(),
      });
      const ent = await getCustomerEntitlementByOwnerEmail(email);
      if (ent?.customerName) {
        await setCustomerEntitlement(ent.customerName, "active");
      }
    } else {
      const ent = await getCustomerEntitlementByOwnerEmail(email);
      if (ent?.customerName) {
        await setCustomerEntitlement(ent.customerName, "past_due");
      }
    }

    return NextResponse.json({
      ok: charged.ok,
      status: charged.status,
      reference: charged.reference,
      amountCents: charged.amountCents,
      message: charged.message,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Charge failed",
      },
      { status: 502 },
    );
  }
}
