import { NextResponse } from "next/server";
import { readAssessmentReportGrant } from "@/lib/assessmentAccess";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";

/** Validate a client-held assessment grant token before showing hub/report. */
export async function POST(request: Request) {
  let body: { grantToken?: string };
  try {
    body = (await request.json()) as { grantToken?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`assessment-session:${ip}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Wait a few minutes." },
      { status: 429 },
    );
  }

  const grant = readAssessmentReportGrant(body.grantToken);
  if (!grant) {
    return NextResponse.json(
      { error: "Unlock expired or invalid. Complete the assessment again." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: grant.email,
    name: grant.name,
    overallScore: grant.overallScore,
    riskBand: grant.riskBand,
  });
}
