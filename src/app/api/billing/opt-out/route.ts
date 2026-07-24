import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import { recordTrialOptOut } from "@/lib/paymentIntel";
import {
  deactivatePaystackAuthorization,
  paystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/paystackServer";

type Body = {
  email?: string;
  name?: string;
  organization?: string;
  planId?: string;
  planLabel?: string;
  reference?: string;
  /** Ignored — server resolves auth code from Paystack verify. */
  authorizationCode?: string;
};

/**
 * Opt out before trial ends — deactivate Paystack authorization and log CRM.
 * Requires email + Paystack reference; authorization is taken from Paystack,
 * not from the client body (prevents arbitrary auth-code deactivation).
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const reference = (body.reference || "").trim();
  if (!email || !isWorkEmail(email)) {
    return NextResponse.json(
      { error: "Valid work email required" },
      { status: 400 },
    );
  }
  if (!reference) {
    return NextResponse.json(
      { error: "Payment reference required to cancel billing" },
      { status: 400 },
    );
  }

  let deactivated = false;
  let deactivateDetail: string | undefined;
  let authCode: string | undefined;

  if (paystackConfigured()) {
    try {
      const verified = await verifyPaystackTransaction(reference);
      const verifiedEmail = (verified.email || "").trim().toLowerCase();
      if (!verified.ok || !verifiedEmail || verifiedEmail !== email) {
        return NextResponse.json(
          {
            error:
              "Could not match this email to the Paystack payment reference",
          },
          { status: 403 },
        );
      }
      authCode = verified.authorizationCode || undefined;
      if (authCode) {
        const result = await deactivatePaystackAuthorization(authCode);
        deactivated = result.ok;
        deactivateDetail = result.message;
      } else {
        deactivateDetail = "No reusable authorization on this reference";
      }
    } catch (err) {
      deactivateDetail =
        err instanceof Error ? err.message : "deactivate failed";
      return NextResponse.json(
        { error: deactivateDetail, ok: false },
        { status: 502 },
      );
    }
  } else {
    deactivateDetail = "Paystack not configured — logged opt-out only";
  }

  const logged = await recordTrialOptOut({
    email,
    name: body.name?.trim(),
    organization: body.organization?.trim(),
    planId: body.planId?.trim(),
    planLabel: body.planLabel?.trim(),
    reference,
    authorizationCode: authCode,
    deactivated,
  });

  return NextResponse.json({
    ok: true,
    deactivated,
    deactivateDetail,
    logged: logged.logged,
    detail: logged.detail,
  });
}
