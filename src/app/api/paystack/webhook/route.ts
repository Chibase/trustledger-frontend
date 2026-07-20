import { NextResponse } from "next/server";
import { recordPaystackPayment } from "@/lib/paymentIntel";
import {
  verifyPaystackSignature,
  verifyPaystackTransaction,
} from "@/lib/paystackServer";

export const runtime = "nodejs";

type PaystackEvent = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaystackEvent;
  try {
    payload = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const reference = payload.data?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const verified = await verifyPaystackTransaction(reference);
    if (!verified.ok || !verified.email) {
      return NextResponse.json({ ok: true, pending: true });
    }

    const logged = await recordPaystackPayment({
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

    console.info("[paystack/webhook] charge.success", {
      reference: verified.reference,
      logged: logged.logged,
      detail: logged.detail,
    });

    return NextResponse.json({ ok: true, logged: logged.logged });
  } catch (err) {
    console.error("[paystack/webhook] failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 },
    );
  }
}
