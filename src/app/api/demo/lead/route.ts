import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import {
  hubspotConfigured,
  isProductionRuntime,
  siteBaseUrl,
  submitHubSpotLead,
} from "@/lib/hubspot";
import type { UtmAttribution } from "@/lib/utm";

type DemoLeadBody = {
  email: string;
  name?: string;
  organization?: string;
  role?: string;
  source?: "demo_entry" | "demo_soft_gate";
  utm?: Partial<UtmAttribution>;
};

function isValid(body: unknown): body is DemoLeadBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.email === "string";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValid(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const name = body.name?.trim();
  const organization = body.organization?.trim();
  const role = body.role?.trim();
  const source = body.source === "demo_soft_gate" ? "demo_soft_gate" : "demo_entry";

  if (!isWorkEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Please use a work email address (personal free-mail domains are not accepted).",
      },
      { status: 400 },
    );
  }

  if (source === "demo_entry" && (!name || name.length < 2)) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }

  const utm = body.utm
    ? [body.utm.source, body.utm.medium, body.utm.campaign]
        .filter(Boolean)
        .join("/")
    : "none";

  const message = [
    `[Source: ${source}] TrustLedger interactive demo lead.`,
    role ? `Demo role: ${role}.` : null,
    organization ? `Organization: ${organization}.` : null,
    `UTM: ${utm}.`,
    `Captured: ${new Date().toISOString()}.`,
  ]
    .filter(Boolean)
    .join(" ");

  if (hubspotConfigured()) {
    try {
      const res = await submitHubSpotLead({
        email,
        name: name || email.split("@")[0],
        company: organization,
        message,
        pageUri: `${siteBaseUrl()}/demo`,
        pageName:
          source === "demo_entry"
            ? "TrustLedger Demo entry"
            : "TrustLedger Demo soft gate",
      });
      if (!res.ok) {
        console.error(
          "[demo/lead] HubSpot failed",
          res.status,
          await res.text().catch(() => ""),
        );
        return NextResponse.json(
          { error: "Lead delivery failed. Please try again." },
          { status: 502 },
        );
      }
    } catch (err) {
      console.error("[demo/lead] HubSpot error", err);
      return NextResponse.json(
        { error: "Lead delivery failed. Please try again." },
        { status: 502 },
      );
    }
  } else if (isProductionRuntime()) {
    return NextResponse.json(
      { error: "Lead capture is temporarily unavailable." },
      { status: 503 },
    );
  } else {
    console.info("[demo/lead] accepted (local)", { email, source, role, utm });
  }

  return NextResponse.json({ ok: true });
}
