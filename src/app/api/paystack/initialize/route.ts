import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import { getPaystackPlan, type PaystackPlanId } from "@/lib/paystackPlans";
import {
  initializePaystackTransaction,
  paystackConfigured,
} from "@/lib/paystackServer";

type Body = {
  email?: string;
  name?: string;
  organization?: string;
  plan?: string;
};

export async function POST(request: Request) {
  if (!paystackConfigured()) {
    return NextResponse.json(
      {
        error:
          "Paystack is not configured on this deployment. Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = body.name?.trim();
  const organization = body.organization?.trim();
  const planId = (body.plan || "").trim() as PaystackPlanId;
  const plan = getPaystackPlan(planId);

  if (!email || !isWorkEmail(email)) {
    return NextResponse.json(
      { error: "Please use a valid work email address." },
      { status: 400 },
    );
  }
  if (!plan || !plan.selfServe) {
    return NextResponse.json(
      { error: "Selected plan is not available for online checkout." },
      { status: 400 },
    );
  }
  if (!plan.amountCents) {
    return NextResponse.json(
      {
        error: `Price for ${plan.label} is not set yet. Set PAYSTACK_AMOUNT_${plan.id.toUpperCase()}_CENTS on Vercel.`,
      },
      { status: 503 },
    );
  }

  try {
    const init = await initializePaystackTransaction({
      email,
      planId: plan.id,
      name,
      organization,
    });
    return NextResponse.json({
      ok: true,
      authorizationUrl: init.authorizationUrl,
      reference: init.reference,
      amountCents: init.amountCents,
      planLabel: init.planLabel,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not start payment",
      },
      { status: 502 },
    );
  }
}
