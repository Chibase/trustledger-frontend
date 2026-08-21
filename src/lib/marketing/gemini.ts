import type { CampaignAsset, ContentDoc } from "@/lib/marketing/types";
import { geminiApiKey, geminiModel } from "@/lib/marketing/config";
import {
  CHIBASE_SYSTEM_RULES,
  TRUSTLEDGER_SYSTEM_RULES,
  findPublicCopyViolations,
  scrubPublicCopy,
  withUtm,
} from "@/lib/marketing/voice";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

function extractJsonObject(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean).slice(0, 6);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,#]/)
      .map((s) => s.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 6);
  }
  return fallback;
}

function fallbackAsset(doc: ContentDoc): CampaignAsset {
  const paragraphs = doc.body
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const body = paragraphs.slice(0, 4).join("\n\n").slice(0, 1300);
  const ctaUrl = withUtm(doc.ctaUrl, doc.slug, doc.brand);
  return {
    headline: doc.title,
    body: `${body}\n\n→ ${doc.ctaLabel}: ${ctaUrl}`,
    hooks: paragraphs.slice(0, 3).map((p) => p.slice(0, 140)),
    hashtags:
      doc.brand === "chibase"
        ? ["SocialLicence", "CommunityParticipation", "IKS", "SouthAfrica"]
        : ["TrustLedger", "SRM", "CommunityTrust", "SouthAfrica"],
    cta: { label: doc.ctaLabel, url: ctaUrl },
    platforms: doc.platforms.length ? doc.platforms : ["linkedin"],
    firstComment: `${doc.ctaLabel}: ${ctaUrl}`,
    outreachDraft:
      doc.kind === "trial-outreach"
        ? `Hello — TrustLedger is SRM software for grievance resolution you can audit. A 14-day trial uses your own data (no sample desk). ${ctaUrl}`
        : undefined,
  };
}

function normalizeAsset(
  doc: ContentDoc,
  parsed: Record<string, unknown> | null,
): CampaignAsset {
  const fallback = fallbackAsset(doc);
  if (!parsed) return fallback;
  const ctaObj =
    parsed.cta && typeof parsed.cta === "object"
      ? (parsed.cta as Record<string, unknown>)
      : {};
  const ctaUrl = withUtm(
    String(ctaObj.url || parsed.ctaUrl || doc.ctaUrl),
    doc.slug,
    doc.brand,
  );
  const body = scrubPublicCopy(
    String(parsed.body || parsed.post || fallback.body),
  ).trim();
  const headline = scrubPublicCopy(
    String(parsed.headline || parsed.subject || doc.title),
  ).trim();
  return {
    headline: headline || fallback.headline,
    body: body || fallback.body,
    hooks: asStringArray(parsed.hooks, fallback.hooks).map(scrubPublicCopy),
    hashtags: asStringArray(parsed.hashtags, fallback.hashtags).map((h) =>
      h.replace(/^#/, ""),
    ),
    cta: {
      label: String(ctaObj.label || parsed.ctaLabel || doc.ctaLabel),
      url: ctaUrl,
    },
    platforms: asStringArray(parsed.platforms, doc.platforms).map((p) =>
      p.toLowerCase(),
    ),
    firstComment: scrubPublicCopy(
      String(parsed.firstComment || fallback.firstComment || ""),
    ),
    outreachDraft: parsed.outreachDraft
      ? scrubPublicCopy(String(parsed.outreachDraft))
      : fallback.outreachDraft,
  };
}

export async function synthesizeCampaign(doc: ContentDoc): Promise<{
  asset: CampaignAsset;
  synthesizer: "gemini" | "template";
  violations: string[];
}> {
  const key = geminiApiKey();
  if (!key) {
    const asset = fallbackAsset(doc);
    return { asset, synthesizer: "template", violations: [] };
  }

  const system =
    doc.brand === "chibase" ? CHIBASE_SYSTEM_RULES : TRUSTLEDGER_SYSTEM_RULES;
  const user = `Source title: ${doc.title}
Kind: ${doc.kind}
Channel: ${doc.channel}
CTA label: ${doc.ctaLabel}
CTA URL: ${doc.ctaUrl}
${doc.source ? `Citation: ${doc.source}\n` : ""}
Source notes:
${doc.body}

Return JSON:
{
  "headline": "string",
  "body": "string",
  "hooks": ["string"],
  "hashtags": ["string"],
  "cta": { "label": "string", "url": "string" },
  "platforms": ["linkedin"],
  "firstComment": "string",
  "outreachDraft": "optional LinkedIn note, only if kind is trial-outreach"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    geminiModel(),
  )}:generateContent`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          maxOutputTokens: 1024,
        },
      }),
    });
    const json = (await res.json()) as GeminiGenerateResponse;
    if (!res.ok) {
      console.warn("[marketing/gemini] HTTP", res.status, json.error?.message);
      return {
        asset: fallbackAsset(doc),
        synthesizer: "template",
        violations: [],
      };
    }
    const text =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("\n")
        .trim() || "";
    const parsed = extractJsonObject(text);
    const asset = normalizeAsset(doc, parsed);
    const violations = findPublicCopyViolations(
      `${asset.headline}\n${asset.body}\n${asset.firstComment || ""}`,
    );
    if (violations.length) {
      asset.body = scrubPublicCopy(asset.body);
      asset.headline = scrubPublicCopy(asset.headline);
    }
    return {
      asset,
      synthesizer: "gemini",
      violations: findPublicCopyViolations(
        `${asset.headline}\n${asset.body}\n${asset.firstComment || ""}`,
      ),
    };
  } catch (err) {
    console.warn("[marketing/gemini] failed", err);
    return {
      asset: fallbackAsset(doc),
      synthesizer: "template",
      violations: [],
    };
  }
}
