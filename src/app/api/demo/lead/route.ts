import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import {
  assertLeadFormGuards,
  normalizeComment,
  readHoneypot,
} from "@/lib/formGuard";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import type { UtmAttribution } from "@/lib/utm";

type DemoLeadBody = {
  email: string;
  name?: string;
  organization?: string;
  role?: string;
  comment?: string;
  company_url?: string;
  tl_hp?: string;
  captchaToken?: string;
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

  const source = body.source === "demo_soft_gate" ? "demo_soft_gate" : "demo_entry";

  const guard = await assertLeadFormGuards(request, {
    routeKey: "demo-lead",
    honeypot: readHoneypot(body as unknown as Record<string, unknown>),
    captchaToken: body.captchaToken,
    captchaAction: source === "demo_entry" ? "demo_entry" : "demo_soft_gate",
  });
  if (!guard.ok) {
    if (guard.silent) {
      console.warn("[demo/lead] honeypot tripped — lead not written");
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const email = body.email.trim().toLowerCase();
  const name = body.name?.trim();
  const organization = body.organization?.trim();
  const role = body.role?.trim();
  const comment =
    source === "demo_entry"
      ? normalizeComment(body.comment, 10)
      : normalizeComment(body.comment ?? "", 0);

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

  if (source === "demo_entry" && !comment) {
    return NextResponse.json(
      {
        error:
          "Please share a short note on what you want to see or solve (at least 10 characters).",
      },
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
    comment ? `Comment: ${comment}` : null,
    `UTM: ${utm}.`,
    `Captured: ${new Date().toISOString()}.`,
  ]
    .filter(Boolean)
    .join(" ");

  if (leadCaptureConfigured()) {
    const result = await submitProductLead({
      email,
      name: name || email.split("@")[0],
      company: organization,
      message,
      pageUri: `${siteBaseUrl()}/demo`,
      pageName:
        source === "demo_entry"
          ? "TrustLedger Demo entry"
          : "TrustLedger Demo soft gate",
      sourceTag: source,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Lead delivery failed. Please try again.",
          backend: result.backend,
          detail:
            process.env.LEAD_DEBUG === "1" ? result.detail : undefined,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, backend: result.backend });
  } else if (isProductionRuntime()) {
    return NextResponse.json(
      { error: "Lead capture is temporarily unavailable." },
      { status: 503 },
    );
  } else {
    console.info("[demo/lead] accepted (local)", {
      email,
      source,
      role,
      utm,
      comment,
    });
  }

  return NextResponse.json({ ok: true });
}
