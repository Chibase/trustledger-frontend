import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import {
  assertLeadFormGuards,
  clientIp,
  honeypotFilled,
  rateLimitAllow,
  readHoneypot,
} from "@/lib/formGuard";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import {
  composeThembaReply,
  isThembaProfile,
  maybePolishWithLlm,
  type ThembaChatMessage,
  type ThembaProfile,
} from "@/lib/themba";

export const runtime = "nodejs";

type EscalatePayload = {
  email?: string;
  name?: string;
  message?: string;
};

type ChatBody = {
  message?: string;
  messages?: ThembaChatMessage[];
  path?: string;
  profile?: ThembaProfile;
  tl_hp?: string;
  company_url?: string;
  escalate?: EscalatePayload;
  captchaToken?: string;
};

function lastUserMessage(body: ChatBody): string | null {
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim().slice(0, 2000);
  }
  if (!Array.isArray(body.messages)) return null;
  for (let i = body.messages.length - 1; i >= 0; i -= 1) {
    const m = body.messages[i];
    if (m?.role === "user" && typeof m.content === "string" && m.content.trim()) {
      return m.content.trim().slice(0, 2000);
    }
  }
  return null;
}

export async function POST(request: Request) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as unknown as Record<string, unknown>;
  if (honeypotFilled(readHoneypot(raw))) {
    return NextResponse.json({
      ok: true,
      reply: "Thanks — we’ll be in touch.",
      escalate: false,
      links: [],
      mode: "knowledge",
    });
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`themba-chat:${ip}`, 24, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a few minutes." },
      { status: 429 },
    );
  }

  // Lead handoff from escalate form
  if (body.escalate && typeof body.escalate === "object") {
    const guard = await assertLeadFormGuards(request, {
      routeKey: "themba-escalate",
      honeypot: readHoneypot(raw),
      captchaToken: body.captchaToken,
      captchaAction: "themba_escalate",
    });
    if (!guard.ok) {
      if (guard.silent) {
        return NextResponse.json({ ok: true, lead: true });
      }
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const email = (body.escalate.email || "").trim().toLowerCase();
    const name = (body.escalate.name || "").trim();
    const note = (body.escalate.message || "").trim().slice(0, 2000);
    const path = typeof body.path === "string" ? body.path : "/";

    if (!isWorkEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Please use a work email address (personal free-mail domains are not accepted).",
        },
        { status: 400 },
      );
    }
    if (note.length < 10) {
      return NextResponse.json(
        { error: "Please include a short note (at least 10 characters)." },
        { status: 400 },
      );
    }

    const composed = [
      "Themba (The Trust) escalate handoff.",
      name ? `Name: ${name}.` : null,
      `Note: ${note}`,
      `Path: ${path}.`,
      `Captured: ${new Date().toISOString()}.`,
    ]
      .filter(Boolean)
      .join("\n");

    if (leadCaptureConfigured()) {
      const result = await submitProductLead({
        email,
        name: name || email.split("@")[0],
        message: composed,
        pageUri: `${siteBaseUrl()}${path}`,
        pageName: "Themba escalate",
        sourceTag: "themba_escalate",
        jobTitle: `Themba escalate · ${path}`,
        userQuote: note,
        role: isThembaProfile(body.profile) ? body.profile : undefined,
      });
      if (!result.ok) {
        return NextResponse.json(
          {
            error: "Could not send your request. Please try Contact instead.",
            detail:
              process.env.LEAD_DEBUG === "1" ? result.detail : undefined,
          },
          { status: 502 },
        );
      }
      return NextResponse.json({
        ok: true,
        lead: true,
        backend: result.backend,
        reply:
          "Thanks — a TrustLedger person will follow up on that work email. You can also start a trial while you wait.",
        links: [
          { href: "/trial", label: "Start trial" },
          { href: "/product", label: "Product overview" },
        ],
      });
    }

    if (isProductionRuntime()) {
      return NextResponse.json(
        {
          error:
            "Handoff is temporarily unavailable. Please use the Contact page.",
        },
        { status: 503 },
      );
    }

    console.info("[themba] escalate accepted (local)", { email, path });
    return NextResponse.json({
      ok: true,
      lead: true,
      reply:
        "Thanks — noted locally. In production this creates a CRM Lead. You can also use Contact.",
      links: [{ href: "/contact", label: "Contact" }],
    });
  }

  const question = lastUserMessage(body);
  if (!question) {
    return NextResponse.json(
      { error: "Please enter a question." },
      { status: 400 },
    );
  }

  const profileHint = isThembaProfile(body.profile) ? body.profile : null;
  const base = composeThembaReply(question, { profile: profileHint });
  const polished = await maybePolishWithLlm(question, base);

  return NextResponse.json({
    ok: true,
    reply: polished.reply,
    escalate: polished.escalate,
    links: polished.links,
    actions: polished.actions,
    chips: polished.chips,
    mode: polished.mode,
    profile: polished.profile,
    magnet: polished.magnet,
    bugHint: polished.bugHint,
  });
}
