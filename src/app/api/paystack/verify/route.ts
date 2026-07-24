import { NextResponse } from "next/server";
import { provisionAfterPaystackVerify } from "@/lib/paystackProvision";
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
    let provision: Awaited<ReturnType<typeof provisionAfterPaystackVerify>> =
      null;
    if (verified.ok && verified.email) {
      provision = await provisionAfterPaystackVerify(verified);
    }

    return NextResponse.json({
      ok: verified.ok,
      status: verified.status,
      reference: verified.reference,
      amountCents: verified.amountCents,
      currency: verified.currency,
      planId: verified.planId,
      planLabel: verified.planLabel,
      planAmountCents: verified.planAmountCents,
      email: verified.email,
      name: verified.name,
      organization: verified.organization,
      checkoutMode: verified.checkoutMode,
      billAt: provision?.billAt || verified.billAt,
      authorizationLast4: verified.authorizationLast4,
      // Credentials only returned once from verify for the success page / email.
      tempPassword: provision?.tempPassword || null,
      activationToken: provision?.activationToken || null,
      emailSent: provision?.emailSent || false,
      emailDetail: provision?.emailDetail || null,
      flow: provision?.flow || verified.checkoutMode,
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
