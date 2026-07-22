import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import {
  recordTrialOptOut,
} from "@/lib/paymentIntel";
import {
  deactivatePaystackAuthorization,
  paystackConfigured,
} from "@/lib/paystackServer";

type Body = {
  email?: string;
  name?: string;
  organization?: string;
  planId?: string;
  planLabel?: string;
  reference?: string;
  authorizationCode?: string;
};

/**
 * Opt out before trial ends — deactivate Paystack authorization and log CRM.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !isWorkEmail(email)) {
    return NextResponse.json(
      { error: "Valid work email required" },
      { status: 400 },
    );
  }

  let deactivated = false;
  let deactivateDetail: string | undefined;
  const authCode = body.authorizationCode?.trim();
  if (authCode && paystackConfigured()) {
    try {
      const result = await deactivatePaystackAuthorization(authCode);
      deactivated = result.ok;
      deactivateDetail = result.message;
    } catch (err) {
      deactivateDetail =
        err instanceof Error ? err.message : "deactivate failed";
    }
  }

  const logged = await recordTrialOptOut({
    email,
    name: body.name?.trim(),
    organization: body.organization?.trim(),
    planId: body.planId?.trim(),
    planLabel: body.planLabel?.trim(),
    reference: body.reference?.trim(),
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
