import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { isWorkEmail } from "@/data/assessment";
import { notifyOpsAlert } from "@/lib/opsAlert";
import { recordEftPayment } from "@/lib/paymentIntel";
import {
  formatZarFromCents,
  getPaystackPlan,
  type PaystackPlanId,
} from "@/lib/paystackPlans";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import { siteBaseUrl } from "@/lib/hubspot";

type EftBody = {
  email?: string;
  name?: string;
  organization?: string;
  plan?: string;
  /** Amount in ZAR rands (e.g. 500 for R500). */
  amountZar?: number;
  reference?: string;
  note?: string;
};

function planIdOf(raw: string | undefined): PaystackPlanId | null {
  if (raw === "practitioner" || raw === "project" || raw === "institutional") {
    return raw;
  }
  return null;
}

export async function POST(request: Request) {
  const jar = await cookies();
  const operatorEmail = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(operatorEmail);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  let body: EftBody;
  try {
    body = (await request.json()) as EftBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim();
  const organization = (body.organization || "").trim() || null;
  const reference = (body.reference || "").trim();
  const note = (body.note || "").trim();
  const planId = planIdOf((body.plan || "").trim().toLowerCase());
  const plan = planId ? getPaystackPlan(planId) : null;

  if (!email || !isWorkEmail(email)) {
    return NextResponse.json(
      { error: "Buyer work email is required." },
      { status: 400 },
    );
  }
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Buyer name is required." },
      { status: 400 },
    );
  }
  if (!plan) {
    return NextResponse.json(
      { error: "Select Practitioner, Project, or Institutional." },
      { status: 400 },
    );
  }
  if (!reference || reference.length < 3) {
    return NextResponse.json(
      { error: "Bank / EFT reference is required (at least 3 characters)." },
      { status: 400 },
    );
  }

  const amountZar =
    typeof body.amountZar === "number" && Number.isFinite(body.amountZar)
      ? body.amountZar
      : plan.amountCents / 100;

  if (!(amountZar > 0)) {
    return NextResponse.json(
      {
        error:
          "Enter amount in ZAR (rands), or set plan list price via PAYSTACK_AMOUNT_*_CENTS.",
      },
      { status: 400 },
    );
  }

  const amountCents = Math.round(amountZar * 100);
  const result = await recordEftPayment({
    email,
    name,
    organization,
    planId: plan.id,
    planLabel: plan.label,
    amountCents,
    currency: "ZAR",
    reference,
    note: note || null,
    confirmedBy: operatorEmail || null,
  });

  if (!result.logged) {
    return NextResponse.json(
      {
        error: "Could not log EFT payment to CRM.",
        detail: result.detail,
      },
      { status: 502 },
    );
  }

  void notifyOpsAlert({
    kind: "eft_payment",
    title: "TrustLedger EFT payment confirmed",
    summary: `${name} · ${email} · ${plan.label} · ${formatZarFromCents(amountCents)} · ref ${reference}`,
    href: `${siteBaseUrl()}/ops/finance`,
  });

  return NextResponse.json({
    ok: true,
    amountLabel: formatZarFromCents(amountCents),
    plan: plan.label,
    reference,
  });
}
