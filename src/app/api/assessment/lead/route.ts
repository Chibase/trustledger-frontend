import { NextResponse } from "next/server";
import type { AssessmentLeadPayload } from "@/types/assessment";
import { isWorkEmail } from "@/data/assessment";

function isValidPayload(body: unknown): body is AssessmentLeadPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === "string" &&
    b.name.trim().length >= 2 &&
    typeof b.email === "string" &&
    typeof b.overallScore === "number" &&
    typeof b.riskBand === "string" &&
    typeof b.landingPath === "string" &&
    typeof b.completedAt === "string" &&
    typeof b.answers === "object" &&
    b.answers !== null &&
    typeof b.dimensionScores === "object" &&
    b.dimensionScores !== null &&
    Array.isArray(b.topPriorities)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();

  if (!isWorkEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Please use a work email address (personal free-mail domains are not accepted).",
      },
      { status: 400 },
    );
  }

  const payload: AssessmentLeadPayload = {
    ...body,
    name,
    email,
    organization: body.organization?.trim() || undefined,
    sector: body.sector?.trim() || undefined,
  };

  const webhook = process.env.ASSESSMENT_WEBHOOK_URL;
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(
          "[assessment/lead] webhook failed",
          res.status,
          await res.text().catch(() => ""),
        );
        return NextResponse.json(
          { error: "Lead delivery failed. Please try again." },
          { status: 502 },
        );
      }
    } catch (err) {
      console.error("[assessment/lead] webhook error", err);
      return NextResponse.json(
        { error: "Lead delivery failed. Please try again." },
        { status: 502 },
      );
    }
  } else {
    console.info(
      "[assessment/lead] accepted (no ASSESSMENT_WEBHOOK_URL)",
      JSON.stringify({
        name: payload.name,
        email: payload.email,
        organization: payload.organization,
        overallScore: payload.overallScore,
        riskBand: payload.riskBand,
        topPriorities: payload.topPriorities,
        utm: payload.utm,
      }),
    );
  }

  return NextResponse.json({ ok: true });
}
