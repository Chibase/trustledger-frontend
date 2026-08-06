import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import { isResourcePackId, resourcePackById } from "@/data/resources";
import {
  assertLeadFormGuards,
  normalizeComment,
  readHoneypot,
  clientIp,
  rateLimitAllow,
} from "@/lib/formGuard";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import {
  resourceDownloadMaxAgeMs,
  signResourceDownloadGrant,
} from "@/lib/resourceAccess";

type DownloadBody = {
  packId?: string;
  name?: string;
  email?: string;
  organization?: string;
  comment?: string;
  tl_hp?: string;
  captchaToken?: string;
};

export async function POST(request: Request) {
  let body: DownloadBody;
  try {
    body = (await request.json()) as DownloadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const packId = (body.packId || "").trim();
  if (!isResourcePackId(packId)) {
    return NextResponse.json({ error: "Unknown resource pack." }, { status: 400 });
  }
  const pack = resourcePackById(packId);
  if (!pack) {
    return NextResponse.json({ error: "Unknown resource pack." }, { status: 400 });
  }

  const guard = await assertLeadFormGuards(request, {
    routeKey: "resource-download",
    honeypot: readHoneypot(body as unknown as Record<string, unknown>),
    captchaToken: body.captchaToken,
    captchaAction: "resource_download",
  });
  if (!guard.ok) {
    if (guard.silent) {
      console.warn("[resources/download] honeypot tripped — lead not written");
      // Fake success without a usable long-lived grant path for bots.
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const organization = (body.organization || "").trim() || undefined;
  const comment = normalizeComment(body.comment, 10);

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!isWorkEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Please use a work email address (personal free-mail domains are not accepted).",
      },
      { status: 400 },
    );
  }
  if (!comment) {
    return NextResponse.json(
      {
        error:
          "Please share briefly how you will use this pack (at least 10 characters).",
      },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`resource-download:${email}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many download requests. Wait a few minutes." },
      { status: 429 },
    );
  }
  if (!rateLimitAllow(`resource-download-ip:${ip}`, 12, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many download requests. Wait a few minutes." },
      { status: 429 },
    );
  }

  const message = [
    `[Source: resource] Downloaded pack “${pack.title}” (${pack.id}).`,
    `Use intent: ${comment}`,
    organization ? `Organization: ${organization}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (leadCaptureConfigured()) {
    const result = await submitProductLead({
      email,
      name,
      company: organization,
      message,
      pageUri: `${siteBaseUrl()}/resources`,
      pageName: `Resource · ${pack.shortTitle}`,
      sourceTag: "resource_download",
      jobTitle: `Resource · ${pack.shortTitle}`,
      userQuote: comment,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Lead delivery failed. Please try again.",
          backend: result.backend,
          detail: process.env.LEAD_DEBUG === "1" ? result.detail : undefined,
        },
        { status: 502 },
      );
    }
  } else if (isProductionRuntime()) {
    console.error("[resources/download] no lead backend in production");
    return NextResponse.json(
      { error: "Downloads are temporarily unavailable." },
      { status: 503 },
    );
  } else {
    console.info(
      "[resources/download] accepted (local — no lead backend)",
      JSON.stringify({ name, email, packId }),
    );
  }

  let token: string;
  try {
    token = signResourceDownloadGrant({
      packId,
      email,
      name,
      exp: Date.now() + resourceDownloadMaxAgeMs(),
    });
  } catch (err) {
    console.error("[resources/download] token secret missing", err);
    return NextResponse.json(
      { error: "Download unlock is misconfigured. Try again later." },
      { status: 503 },
    );
  }

  const downloadPath = `/api/resources/file?token=${encodeURIComponent(token)}`;

  return NextResponse.json({
    ok: true,
    packId,
    downloadUrl: downloadPath,
    filename: pack.filename,
  });
}
