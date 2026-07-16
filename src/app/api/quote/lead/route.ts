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
import { notifyOpsAlert } from "@/lib/opsAlert";
import {
  formatZarFromCents,
  getPaystackPlan,
  type PaystackPlanId,
} from "@/lib/paystackPlans";

type QuoteBody = {
  email: string;
  name?: string;
  organization?: string;
  message?: string;
  plan?: string;
  tl_hp?: string;
  company_url?: string;
  captchaToken?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
};

function isValid(body: unknown): body is QuoteBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return typeof b.email === "string";
}

function planIdOf(raw: string | undefined): PaystackPlanId | null {
  if (raw === "practitioner" || raw === "project" || raw === "institutional") {
    return raw;
  }
  return null;
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

  const guard = await assertLeadFormGuards(request, {
    routeKey: "quote-lead",
    honeypot: readHoneypot(body as unknown as Record<string, unknown>),
    captchaToken: body.captchaToken,
    captchaAction: "quote_request",
  });
  if (!guard.ok) {
    if (guard.silent) {
      console.warn("[quote] honeypot tripped");
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const email = body.email.trim().toLowerCase();
  const name = body.name?.trim();
  const organization = body.organization?.trim();
  const message = normalizeComment(body.message, 10);
  const planId = planIdOf(body.plan?.trim().toLowerCase());
  const plan = planId ? getPaystackPlan(planId) : null;

  if (!isWorkEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Please use a work email address (personal free-mail domains are not accepted).",
      },
      { status: 400 },
    );
  }

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }

  if (!plan) {
    return NextResponse.json(
      { error: "Please choose a plan (Practitioner, Project, or Institutional)." },
      { status: 400 },
    );
  }

  if (!message) {
    return NextResponse.json(
      {
        error:
          "Please include a short note on scope or timeline (at least 10 characters).",
      },
      { status: 400 },
    );
  }

  const amountLabel = formatZarFromCents(plan.amountCents);
  const utmParts = body.utm
    ? [
        body.utm.source,
        body.utm.medium,
        body.utm.campaign,
        body.utm.content,
        body.utm.term,
      ]
        .filter(Boolean)
        .join("/")
    : "";

  const composed = [
    "TrustLedger quote request (soft-launch EFT / invoice path).",
    `Plan: ${plan.label}.`,
    `List price: ${amountLabel} ZAR (indicative — confirm on quote).`,
    organization ? `Organization: ${organization}.` : null,
    `Message: ${message}`,
    utmParts ? `UTM: ${utmParts}.` : null,
    `Captured: ${new Date().toISOString()}.`,
    "Action: send Quotation / Sales Invoice from Frappe Desk; confirm EFT in Ops → Finance when paid.",
  ]
    .filter(Boolean)
    .join("\n");

  const jobTitle = `Quote request · ${plan.label} · ${amountLabel}`;

  if (leadCaptureConfigured()) {
    const result = await submitProductLead({
      email,
      name,
      company: organization,
      message: composed,
      pageUri: `${siteBaseUrl()}/quote`,
      pageName: "TrustLedger quote request",
      sourceTag: "quote_request",
      crmSource: "Quote Request",
      jobTitle,
      userQuote: message,
      utm: utmParts || undefined,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Could not submit quote request. Please try again.",
          backend: result.backend,
          detail:
            process.env.LEAD_DEBUG === "1" ? result.detail : undefined,
        },
        { status: 502 },
      );
    }

    void notifyOpsAlert({
      kind: "quote_request",
      title: "TrustLedger quote request",
      summary: `${name} · ${email} · ${plan.label} · ${amountLabel}${organization ? ` · ${organization}` : ""}`,
      href: `${siteBaseUrl()}/ops/finance`,
    });

    return NextResponse.json({ ok: true, backend: result.backend });
  }

  if (isProductionRuntime()) {
    return NextResponse.json(
      { error: "Quote requests are temporarily unavailable." },
      { status: 503 },
    );
  }

  console.info("[quote] accepted (local)", { email, plan: plan.id });
  return NextResponse.json({ ok: true });
}
