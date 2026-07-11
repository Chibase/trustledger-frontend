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

function firstNameFrom(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || fullName;
}

function lastNameFrom(fullName: string): string | undefined {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  return parts.slice(1).join(" ");
}

function buildAssessmentMessage(payload: AssessmentLeadPayload): string {
  const scores = Object.entries(payload.dimensionScores)
    .map(([id, score]) => `${id}:${score}`)
    .join(", ");
  const utm = payload.utm
    ? [payload.utm.source, payload.utm.medium, payload.utm.campaign]
        .filter(Boolean)
        .join("/")
    : "none";

  return [
    `SRM Assessment score ${payload.overallScore}/100 (${payload.riskBand}).`,
    `Top priorities: ${payload.topPriorities.join(", ") || "n/a"}.`,
    `Dimension scores: ${scores || "n/a"}.`,
    payload.sector ? `Sector: ${payload.sector}.` : null,
    `UTM: ${utm}.`,
    `Completed: ${payload.completedAt}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

async function submitToHubSpot(payload: AssessmentLeadPayload): Promise<Response> {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formId = process.env.HUBSPOT_FORM_ID;
  const region = (process.env.HUBSPOT_REGION || "eu1").toLowerCase();

  if (!portalId || !formId) {
    throw new Error("HubSpot portal/form not configured");
  }

  const host =
    region === "na1" || region === "us1"
      ? "api.hsforms.com"
      : `api-${region}.hsforms.com`;

  const url = `https://${host}/submissions/v3/integration/submit/${portalId}/${formId}`;

  const fields: { name: string; value: string }[] = [
    { name: "email", value: payload.email },
    { name: "firstname", value: firstNameFrom(payload.name) },
  ];

  const lastname = lastNameFrom(payload.name);
  if (lastname) fields.push({ name: "lastname", value: lastname });
  if (payload.organization) {
    fields.push({ name: "company", value: payload.organization });
  }
  fields.push({ name: "message", value: buildAssessmentMessage(payload) });

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fields,
      context: {
        pageUri: `https://trustledger-frontend-pi.vercel.app${payload.landingPath}`,
        pageName: "SRM Readiness Assessment",
      },
    }),
  });
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

  const hubspotReady =
    Boolean(process.env.HUBSPOT_PORTAL_ID) &&
    Boolean(process.env.HUBSPOT_FORM_ID);
  const webhook = process.env.ASSESSMENT_WEBHOOK_URL;

  if (hubspotReady) {
    try {
      const res = await submitToHubSpot(payload);
      if (!res.ok) {
        console.error(
          "[assessment/lead] HubSpot failed",
          res.status,
          await res.text().catch(() => ""),
        );
        return NextResponse.json(
          { error: "Lead delivery failed. Please try again." },
          { status: 502 },
        );
      }
    } catch (err) {
      console.error("[assessment/lead] HubSpot error", err);
      return NextResponse.json(
        { error: "Lead delivery failed. Please try again." },
        { status: 502 },
      );
    }
  } else if (webhook) {
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
      "[assessment/lead] accepted (no HubSpot / webhook configured)",
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
