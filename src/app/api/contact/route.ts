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

type ContactKind = "contact" | "feedback";

type ContactBody = {
  email: string;
  name?: string;
  organization?: string;
  message?: string;
  kind?: ContactKind;
  rating?: number;
  path?: string;
  tl_hp?: string;
  company_url?: string;
  captchaToken?: string;
};

function isValid(body: unknown): body is ContactBody {
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

  const kind: ContactKind = body.kind === "feedback" ? "feedback" : "contact";
  const captchaAction = kind === "feedback" ? "product_feedback" : "contact";

  const guard = await assertLeadFormGuards(request, {
    routeKey: `contact-${kind}`,
    honeypot: readHoneypot(body as unknown as Record<string, unknown>),
    captchaToken: body.captchaToken,
    captchaAction,
  });
  if (!guard.ok) {
    if (guard.silent) {
      console.warn(`[contact] honeypot tripped (${kind})`);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const email = body.email.trim().toLowerCase();
  const name = body.name?.trim();
  const organization = body.organization?.trim();
  const message = normalizeComment(body.message, 10);
  const path = typeof body.path === "string" ? body.path : undefined;

  if (!isWorkEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Please use a work email address (personal free-mail domains are not accepted).",
      },
      { status: 400 },
    );
  }

  if (kind === "contact" && (!name || name.length < 2)) {
    return NextResponse.json(
      { error: "Please enter your name." },
      { status: 400 },
    );
  }

  if (!message) {
    return NextResponse.json(
      {
        error:
          kind === "feedback"
            ? "Please share a short note on what worked or what we should improve (at least 10 characters)."
            : "Please include a short message (at least 10 characters).",
      },
      { status: 400 },
    );
  }

  const rating =
    typeof body.rating === "number" &&
    Number.isFinite(body.rating) &&
    body.rating >= 1 &&
    body.rating <= 5
      ? Math.round(body.rating)
      : undefined;

  if (kind === "feedback" && rating === undefined) {
    return NextResponse.json(
      { error: "Please choose a rating from 1 to 5." },
      { status: 400 },
    );
  }

  const composed = [
    kind === "feedback"
      ? "TrustLedger experience feedback (user view)."
      : "TrustLedger contact form enquiry.",
    rating !== undefined ? `Rating: ${rating}/5.` : null,
    organization ? `Organization: ${organization}.` : null,
    `Message: ${message}`,
    path ? `Path: ${path}.` : null,
    `Captured: ${new Date().toISOString()}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const jobTitle =
    kind === "feedback"
      ? `Feedback · ${rating}/5${path ? ` · ${path}` : ""}`
      : `Contact enquiry${path ? ` · ${path}` : ""}`;

  if (leadCaptureConfigured()) {
    const result = await submitProductLead({
      email,
      name: name || email.split("@")[0],
      company: organization,
      message: composed,
      pageUri: `${siteBaseUrl()}${path || (kind === "feedback" ? "/feedback" : "/contact")}`,
      pageName:
        kind === "feedback"
          ? "TrustLedger product feedback"
          : "TrustLedger contact",
      sourceTag: kind === "feedback" ? "product_feedback" : "contact",
      jobTitle,
      rating,
      userQuote: message,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Could not send your message. Please try again.",
          backend: result.backend,
          detail:
            process.env.LEAD_DEBUG === "1" ? result.detail : undefined,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, backend: result.backend });
  }

  if (isProductionRuntime()) {
    return NextResponse.json(
      { error: "Contact is temporarily unavailable." },
      { status: 503 },
    );
  }

  console.info("[contact] accepted (local)", { kind, email, rating });
  return NextResponse.json({ ok: true });
}
