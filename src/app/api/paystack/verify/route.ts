import { NextResponse } from "next/server";
import { recordPaystackPayment } from "@/lib/paymentIntel";
import {
  paystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/paystackServer";

export async function GET(request: Request) {
  if (!paystackConfigured()) {
    return NextResponse.json(
      { error: "Paystack is not configured" },
      { status: 503 },
    );
  }

  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }

  try {
    const verified = await verifyPaystackTransaction(reference);
    if (verified.ok && verified.email) {
      // Idempotent enough for soft launch: CRM may get a second note if webhook also fired.
      await recordPaystackPayment({
        email: verified.email,
        name: verified.name,
        organization: verified.organization,
        planId: verified.planId,
        planLabel: verified.planLabel,
        amountCents: verified.amountCents,
        currency: verified.currency,
        reference: verified.reference,
        paidAt: verified.paidAt,
      });
    }

    return NextResponse.json({
      ok: verified.ok,
      status: verified.status,
      reference: verified.reference,
      amountCents: verified.amountCents,
      currency: verified.currency,
      planLabel: verified.planLabel,
      email: verified.email,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Verify failed",
      },
      { status: 502 },
    );
  }
}
