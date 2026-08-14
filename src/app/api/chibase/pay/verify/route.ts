import { NextResponse } from "next/server";
import {
  isChibasePaystackTransaction,
  recordChibasePackagePayment,
} from "@/lib/chibase/paystack";
import {
  paystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/paystackServer";

export async function GET(request: Request) {
  if (!paystackConfigured()) {
    return NextResponse.json(
      { error: "Checkout is not configured" },
      { status: 503 },
    );
  }

  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }

  try {
    const verified = await verifyPaystackTransaction(reference);
    if (!verified.ok) {
      return NextResponse.json({
        ok: false,
        status: verified.status,
        reference: verified.reference,
      });
    }

    if (!isChibasePaystackTransaction(verified)) {
      return NextResponse.json(
        {
          error:
            "This reference is a TrustLedger software payment, not a Chibase package.",
        },
        { status: 400 },
      );
    }

    const recorded = await recordChibasePackagePayment(verified);
    return NextResponse.json({
      ok: true,
      status: verified.status,
      reference: verified.reference,
      amountCents: verified.amountCents,
      currency: verified.currency,
      packageId: verified.packageId,
      packageLabel: recorded.packageLabel,
      email: verified.email,
      name: verified.name,
      organization: verified.organization,
      logged: recorded.logged,
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
