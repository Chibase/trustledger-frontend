/**
 * Public-copy bans for the marketing engine (ADR-039, ADR-006).
 * Stack vendor names may appear in internal docs and ClickUp operator notes,
 * never in the post body that Zernio publishes.
 */

export const PUBLIC_VENDOR_BANS = [
  "frappe",
  "vercel",
  "hubspot",
  "interserv",
  "accordbridge",
  "gemini",
  "zernio",
  "clickup",
  "paystack",
  "grok",
  "openai",
  "chatgpt",
  "wordpress",
  "webway",
] as const;

const BAN_RE = new RegExp(
  `\\b(${PUBLIC_VENDOR_BANS.join("|")})\\b`,
  "gi",
);

export function findPublicCopyViolations(text: string): string[] {
  const found = new Set<string>();
  const matches = text.matchAll(BAN_RE);
  for (const m of matches) {
    if (m[1]) found.add(m[1].toLowerCase());
  }
  return [...found];
}

export function scrubPublicCopy(text: string): string {
  return text.replace(BAN_RE, () => "cloud");
}

export function isoWeekKey(date: Date = new Date()): string {
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekStr = String(week).padStart(2, "0");
  return `${utc.getUTCFullYear()}-W${weekStr}`;
}

export function withUtm(url: string, campaign: string, brand: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", "engine");
    }
    if (!u.searchParams.has("utm_medium")) {
      u.searchParams.set("utm_medium", "linkedin");
    }
    if (!u.searchParams.has("utm_campaign")) {
      u.searchParams.set("utm_campaign", `mkt_${brand}_${campaign}`);
    }
    return u.toString();
  } catch {
    return url;
  }
}

export const TRUSTLEDGER_SYSTEM_RULES = `You draft public social copy for TrustLedger, Stakeholder Relationship Management (SRM) software.

Rules:
- Product name: TrustLedger only. Promise: Resolution you can audit.
- Voice: Trust — calm, institutional; lead with trust outcomes and auditability.
- Never name Frappe, Vercel, HubSpot, Interserv, AccordBridge, Paystack, Gemini, Zernio, ClickUp, Grok, WordPress, or Webway.
- Hosting = “TrustLedger Cloud” / “cloud” if needed.
- Do not over-claim: no auto-closing AI, no sample demo desk, no public community portal, no full GIS, no SOC2.
- Do not mention Version 001, Version 002, TEDS, or ESIP in public copy.
- AI Assist = suggest only; humans apply before save.
- Sample demo desk is retired; point to product overview + 14-day trial with own data.
- One primary CTA. LinkedIn-length body (~800–1300 characters). 3–5 hashtags max.
- Do not co-brand the hero with Chibase Consulting.
- Output JSON only.`;

export const CHIBASE_SYSTEM_RULES = `You draft public social copy for Chibase Consulting, a social facilitation and advisory practice (South Africa / Global South).

Rules:
- Speaker is Chibase Consulting. Tagline: Social licence for infrastructure that has to move.
- Voice: practitioner, calm, field-literate. Thought leadership — not a product dump.
- TrustLedger may be mentioned once as a complementary, separate SRM product — never as a co-branded hero, never as if consulting unlocks software.
- Never name Frappe, Vercel, HubSpot, Interserv, AccordBridge, Paystack, Gemini, Zernio, ClickUp, Grok, WordPress, or Webway.
- Do not invent paper titles, findings, or quotations beyond the source note provided.
- One primary CTA to the Chibase site. LinkedIn-length body (~800–1300 characters). 3–5 hashtags max.
- Output JSON only.`;
