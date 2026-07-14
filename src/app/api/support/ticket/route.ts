import { NextResponse } from "next/server";
import {
  SUPPORT_CATEGORIES,
  type SupportCategoryCode,
} from "@/data/supportCatalog";
import { isWorkEmail } from "@/data/assessment";
import { assertLeadFormGuards, readHoneypot } from "@/lib/formGuard";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";

type SupportTicketBody = {
  email: string;
  name?: string;
  category: SupportCategoryCode;
  description: string;
  path?: string;
  role?: string;
  mode?: string;
  userAgent?: string;
  health?: unknown;
  company_url?: string;
  tl_hp?: string;
  captchaToken?: string;
};

function isCategory(value: string): value is SupportCategoryCode {
  return SUPPORT_CATEGORIES.some((c) => c.code === value);
}

function isValid(body: unknown): body is SupportTicketBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.email === "string" &&
    typeof b.category === "string" &&
    typeof b.description === "string" &&
    b.description.trim().length >= 8 &&
    isCategory(b.category)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValid(body)) {
    return NextResponse.json(
      { error: "Provide a work email, category, and short description." },
      { status: 400 },
    );
  }

  const guard = await assertLeadFormGuards(request, {
    routeKey: "support-ticket",
    honeypot: readHoneypot(body as unknown as Record<string, unknown>),
    captchaToken: body.captchaToken,
    captchaAction: "support_ticket",
  });
  if (!guard.ok) {
    if (guard.silent) {
      console.warn("[support/ticket] honeypot tripped — ticket not written");
      return NextResponse.json({
        ok: true,
        ticketId: `TL-SUP-${Date.now().toString(36).toUpperCase()}`,
      });
    }
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

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

  const categoryMeta = SUPPORT_CATEGORIES.find((c) => c.code === body.category);
  const ticketId = `TL-SUP-${Date.now().toString(36).toUpperCase()}`;

  const message = [
    `[Source: support_ticket] ${ticketId}`,
    `Category: ${body.category} (${categoryMeta?.label ?? body.category})`,
    `Mode: ${body.mode ?? "unknown"} · Role: ${body.role ?? "unknown"}`,
    `Path: ${body.path ?? "n/a"}`,
    `UA: ${body.userAgent ?? "n/a"}`,
    `Description: ${body.description.trim()}`,
    body.health
      ? `Health: ${JSON.stringify(body.health).slice(0, 800)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (leadCaptureConfigured()) {
    const result = await submitProductLead({
      email,
      name: body.name?.trim(),
      message,
      pageUri: `${siteBaseUrl()}${body.path || "/app/dashboard"}`,
      pageName: "TrustLedger in-app support",
      sourceTag: "support_ticket",
      jobTitle: `Support · ${body.category}`,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Could not submit ticket. Try again." },
        { status: 502 },
      );
    }
  } else if (isProductionRuntime()) {
    return NextResponse.json(
      { error: "Support intake is temporarily unavailable." },
      { status: 503 },
    );
  } else {
    console.info("[support/ticket] accepted (local)", { ticketId, email });
  }

  return NextResponse.json({ ok: true, ticketId });
}
