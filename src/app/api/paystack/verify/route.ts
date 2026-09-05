import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isChibasePaystackTransaction } from "@/lib/chibase/paystack";
import { provisionAfterPaystackVerify } from "@/lib/paystackProvision";
import {
  paystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/paystackServer";
import {
  attachPaystackVerifyReveal,
  decidePaystackCredentialReveal,
  markPaystackVerifyMinted,
  PAYSTACK_VERIFY_REVEAL_COOKIE,
  paystackVerifyAlreadyMinted,
  paystackVerifyRateLimit,
  verifyPaystackRevealToken,
} from "@/lib/paystackVerifyGuard";

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

  if (!paystackVerifyRateLimit(request, reference)) {
    return NextResponse.json(
      { error: "Too many verify requests. Try again later." },
      { status: 429 },
    );
  }

  const jar = await cookies();
  const revealToken = jar.get(PAYSTACK_VERIFY_REVEAL_COOKIE)?.value;
  const hasRevealCookie = verifyPaystackRevealToken(revealToken, reference);
  const alreadyMinted = paystackVerifyAlreadyMinted(reference);
  const reveal = decidePaystackCredentialReveal({
    alreadyMinted,
    hasRevealCookie,
  });
  const mintCredentials = reveal !== "withhold";
  const sendWelcomeEmail = reveal === "mint";

  try {
    const verified = await verifyPaystackTransaction(reference);
    if (isChibasePaystackTransaction(verified)) {
      return NextResponse.json(
        {
          error:
            "This reference is a Chibase Consulting package. Verify it on the consulting checkout success page.",
        },
        { status: 400 },
      );
    }
    let provision: Awaited<ReturnType<typeof provisionAfterPaystackVerify>> =
      null;
    if (verified.ok && verified.email) {
      provision = await provisionAfterPaystackVerify(verified, {
        mintCredentials,
        sendWelcomeEmail,
      });
      if (mintCredentials) {
        markPaystackVerifyMinted(reference);
      }
    }

    const credentialsOnce =
      mintCredentials && provision
        ? {
            tempPassword: provision.tempPassword || null,
            activationToken: provision.activationToken || null,
          }
        : { tempPassword: null, activationToken: null };

    const response = NextResponse.json({
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
      tempPassword: credentialsOnce.tempPassword,
      activationToken: credentialsOnce.activationToken,
      emailSent: sendWelcomeEmail ? provision?.emailSent || false : false,
      emailDetail: sendWelcomeEmail
        ? provision?.emailDetail || null
        : mintCredentials
          ? null
          : "Credentials were already issued for this payment.",
      flow: provision?.flow || verified.checkoutMode,
    });
    if (mintCredentials && verified.ok) {
      attachPaystackVerifyReveal(response, reference);
    }
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Verify failed",
      },
      { status: 502 },
    );
  }
}
