import { NextResponse } from "next/server";
import { verifyTrialActivationToken } from "@/lib/trialProvision";

/** Decode a signed trial activation token (email deep-link). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const payload = verifyTrialActivationToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Activation link expired or invalid." },
      { status: 401 },
    );
  }
  return NextResponse.json({
    ok: true,
    email: payload.email,
    name: payload.name,
    planId: payload.planId,
    organization: payload.organization || null,
    startedAt: payload.startedAt,
    billAt: payload.billAt,
    reference: payload.reference,
    authorizationCode: payload.authorizationCode || null,
  });
}
