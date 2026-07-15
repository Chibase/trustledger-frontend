import { frappeBase, frappeKeyPair } from "@/lib/leadCapture";
import {
  activityLabel,
  type OpsActivityKind,
  type OpsActivityRow,
} from "@/lib/opsIntel";

export type InfluenceLevel =
  | "decision_maker"
  | "buyer"
  | "delivery"
  | "stakeholder"
  | "unspecified";

export type SentimentLabel =
  | "positive"
  | "mixed"
  | "negative"
  | "neutral"
  | "unrated";

export type VoiceQuote = {
  leadName: string;
  person: string;
  organization: string | null;
  activity: OpsActivityKind;
  activityLabel: string;
  rating: number | null;
  sentiment: SentimentLabel;
  influence: InfluenceLevel;
  industry: string | null;
  origin: string | null;
  quote: string;
  modified: string | null;
};

export type DemoBucket = { label: string; value: number };

export type VoiceIntel = {
  origins: DemoBucket[];
  industries: DemoBucket[];
  influence: DemoBucket[];
  sentiments: DemoBucket[];
  quotes: VoiceQuote[];
  perceptionSummary: string;
};

type CrmComment = {
  name: string;
  reference_name?: string;
  content?: string;
  creation?: string;
  modified?: string;
};

function authHeaders(key: string, secret: string): HeadersInit {
  return {
    Authorization: `token ${key}:${secret}`,
    Accept: "application/json",
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function matchField(text: string, label: string): string | null {
  const re = new RegExp(
    `${label}\\s*[:：]\\s*([^.|\\n]+?)(?:\\.|$|\\s{2,}|\\s+[A-Z][a-z]+\\s*:)`,
    "i",
  );
  const m = text.match(re);
  if (!m?.[1]) return null;
  const value = m[1].trim().replace(/\.$/, "");
  if (!value || /^n\/?a$/i.test(value) || /^none$/i.test(value)) return null;
  return value;
}

function extractQuote(text: string): string | null {
  const patterns = [
    /(?:^|\n|\.\s*)Comment:\s*([\s\S]+?)(?:\s+(?:Top priorities|Dimension scores|Sector|UTM|Completed|Path|Captured|Organization|Demo role|Rating|Mode):|\s*TL_META|$)/i,
    /(?:^|\n|\.\s*)Message:\s*([\s\S]+?)(?:\s+(?:Path|Captured|Organization|Rating|TL_META):|\s*TL_META|$)/i,
    /User view:\s*([\s\S]+?)(?:\s*TL_META|$)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      let quote = m[1].trim();
      // Drop leading composed wrappers
      quote = quote
        .replace(/^TrustLedger (?:experience feedback \(user view\)|contact form enquiry)\.\s*/i, "")
        .replace(/^Rating:\s*[1-5]\/5\.\s*/i, "")
        .replace(/^Organization:\s*[^.]+.\s*/i, "")
        .replace(/^Message:\s*/i, "")
        .trim();
      if (quote.length >= 12) return quote.slice(0, 480);
    }
  }
  return null;
}

function parseUtm(text: string): string | null {
  const raw = matchField(text, "UTM");
  if (!raw) return null;
  return raw;
}

function parseIndustry(text: string, organization: string | null): string | null {
  return (
    matchField(text, "Sector") ||
    matchField(text, "Industry") ||
    inferIndustryFromOrg(organization)
  );
}

function inferIndustryFromOrg(organization: string | null): string | null {
  if (!organization) return null;
  const o = organization.toLowerCase();
  if (/municip|city of|metro|council|ward/.test(o)) return "Municipal / public";
  if (/mine|mining|mineral/.test(o)) return "Mining";
  if (/construct|civils|infra/.test(o)) return "Infrastructure / construction";
  if (/energ|power|utility|eskom/.test(o)) return "Energy / utilities";
  if (/consult|advisory/.test(o)) return "Consulting";
  if (/ngo|non[- ]profit|foundation/.test(o)) return "NGO / civil society";
  return null;
}

function parseRole(text: string, jobTitle: string | undefined): string | null {
  return (
    matchField(text, "Demo role") ||
    matchField(text, "Role") ||
    (jobTitle && !/feedback|assessment|contact|support|demo/i.test(jobTitle)
      ? jobTitle
      : null)
  );
}

function classifyInfluence(
  role: string | null,
  text: string,
  organization: string | null,
): InfluenceLevel {
  const blob = `${role || ""} ${text} ${organization || ""}`.toLowerCase();
  if (
    /\b(admin|administrator|ceo|cfo|coo|cto|director|executive|board|owner|municipal manager|mm|hod|head of|chief)\b/.test(
      blob,
    )
  ) {
    return "decision_maker";
  }
  if (/\b(client|buyer|procurement|programme manager|program manager|pm)\b/.test(blob)) {
    return "buyer";
  }
  if (/\b(contractor|supplier|vendor|site\s?agent)\b/.test(blob)) {
    return "delivery";
  }
  if (/\b(community|resident|ward|stakeholder|civil society)\b/.test(blob)) {
    return "stakeholder";
  }
  if (organization) return "buyer";
  return "unspecified";
}

function influenceLabel(level: InfluenceLevel): string {
  switch (level) {
    case "decision_maker":
      return "Decision maker";
    case "buyer":
      return "Buyer / programme";
    case "delivery":
      return "Delivery / contractor";
    case "stakeholder":
      return "Community stakeholder";
    default:
      return "Unspecified";
  }
}

function sentimentFromRating(rating: number | null): SentimentLabel {
  if (rating == null) return "unrated";
  if (rating <= 2) return "negative";
  if (rating === 3) return "mixed";
  return "positive";
}

function refineSentiment(base: SentimentLabel, quote: string | null): SentimentLabel {
  if (!quote) return base;
  const q = quote.toLowerCase();
  const neg =
    /(frustrat|confus|broken|slow|bug|unusable|poor|terrible|hate|unclear|missing)/.test(
      q,
    );
  const pos =
    /(clear|helpful|love|great|excellent|smooth|easy|useful|impressed|thank)/.test(
      q,
    );
  if (base === "unrated" || base === "neutral") {
    if (neg && !pos) return "negative";
    if (pos && !neg) return "positive";
    if (pos && neg) return "mixed";
    return "neutral";
  }
  if (base === "positive" && neg && !pos) return "mixed";
  if (base === "negative" && pos && !neg) return "mixed";
  return base;
}

function sentimentLabel(s: SentimentLabel): string {
  switch (s) {
    case "positive":
      return "Positive experience";
    case "mixed":
      return "Mixed / cautious";
    case "negative":
      return "Weak experience";
    case "neutral":
      return "Neutral tone";
    default:
      return "Unrated";
  }
}

function originLabel(utm: string | null, source: string | undefined, path: string | null): string {
  if (utm && utm !== "none") {
    const parts = utm.split("/").filter(Boolean);
    if (parts[0]) return parts.slice(0, 2).join(" · ");
  }
  if (path && path.includes("wordpress")) return "WordPress / site CTA";
  if (source) return source;
  if (path) return path;
  return "Direct / unknown";
}

function countBuckets(
  items: string[],
  limit = 6,
): DemoBucket[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

async function fetchLeadComments(
  key: string,
  secret: string,
  leadNames: string[],
): Promise<Map<string, string>> {
  const byLead = new Map<string, string>();
  if (!leadNames.length) return byLead;

  // Chunk to keep filter URLs reasonable
  const chunkSize = 40;
  for (let i = 0; i < leadNames.length; i += chunkSize) {
    const chunk = leadNames.slice(i, i + chunkSize);
    const filters = encodeURIComponent(
      JSON.stringify([
        ["reference_doctype", "=", "CRM Lead"],
        ["reference_name", "in", chunk],
        ["comment_type", "=", "Comment"],
      ]),
    );
    const fields = encodeURIComponent(
      JSON.stringify(["name", "reference_name", "content", "creation", "modified"]),
    );
    const res = await fetch(
      `${frappeBase()}/api/resource/Comment?fields=${fields}&filters=${filters}&limit_page_length=200&order_by=creation%20desc`,
      { headers: authHeaders(key, secret), cache: "no-store" },
    );
    if (!res.ok) continue;
    const json = (await res.json()) as { data?: CrmComment[] };
    for (const row of json.data || []) {
      if (!row.reference_name || !row.content) continue;
      // Keep earliest intake-style comment if multiple; prefer first seen (newest order) that has quote cues
      const text = stripHtml(row.content);
      const existing = byLead.get(row.reference_name);
      if (!existing) {
        byLead.set(row.reference_name, text);
        continue;
      }
      // Prefer the one with an explicit Comment/Message/User view
      if (
        !/Comment:|Message:|User view:/i.test(existing) &&
        /Comment:|Message:|User view:/i.test(text)
      ) {
        byLead.set(row.reference_name, text);
      }
    }
  }
  return byLead;
}

function perceptionSummary(
  sentiments: Record<SentimentLabel, number>,
  quoteCount: number,
): string {
  const rated =
    sentiments.positive + sentiments.mixed + sentiments.negative + sentiments.neutral;
  if (!rated && !quoteCount) {
    return "Voice sample is still thin — quotes and sentiment will appear as feedback and assessment notes land.";
  }
  const parts: string[] = [];
  if (sentiments.positive) {
    parts.push(`${sentiments.positive} positive`);
  }
  if (sentiments.mixed) parts.push(`${sentiments.mixed} mixed`);
  if (sentiments.negative) parts.push(`${sentiments.negative} weak`);
  if (parts.length) {
    return `Tool-usage perception from rated/tonal signals: ${parts.join(", ")}. ${quoteCount} exact-voice quotes available for board packs.`;
  }
  return `${quoteCount} exact-voice quotes captured; rating-based sentiment still building.`;
}

export async function buildVoiceIntel(
  rows: OpsActivityRow[],
): Promise<VoiceIntel> {
  const empty: VoiceIntel = {
    origins: [],
    industries: [],
    influence: [],
    sentiments: [],
    quotes: [],
    perceptionSummary: perceptionSummary(
      { positive: 0, mixed: 0, negative: 0, neutral: 0, unrated: 0 },
      0,
    ),
  };

  const pair = frappeKeyPair();
  if (!pair || !rows.length) return empty;

  let comments = new Map<string, string>();
  try {
    comments = await fetchLeadComments(
      pair.key,
      pair.secret,
      rows.map((r) => r.name),
    );
  } catch {
    comments = new Map();
  }

  const origins: string[] = [];
  const industries: string[] = [];
  const influenceLevels: InfluenceLevel[] = [];
  const sentimentCounts: Record<SentimentLabel, number> = {
    positive: 0,
    mixed: 0,
    negative: 0,
    neutral: 0,
    unrated: 0,
  };
  const quotes: VoiceQuote[] = [];

  for (const row of rows) {
    const text = comments.get(row.name) || "";
    const org = row.organization || matchField(text, "Organization");
    const utm = parseUtm(text);
    const path = matchField(text, "Path") || matchField(text, "Page");
    const industry = parseIndustry(text, org);
    const role = parseRole(text, row.job_title);
    const influence = classifyInfluence(role, text, org);
    const quote = extractQuote(text);
    const sentiment = refineSentiment(sentimentFromRating(row.rating), quote);

    origins.push(originLabel(utm, row.source, path));
    if (industry) industries.push(industry);
    influenceLevels.push(influence);
    sentimentCounts[sentiment] += 1;

    if (quote) {
      quotes.push({
        leadName: row.name,
        person: row.lead_name || row.name,
        organization: org,
        activity: row.activity,
        activityLabel: activityLabel(row.activity),
        rating: row.rating,
        sentiment,
        influence,
        industry,
        origin: originLabel(utm, row.source, path),
        quote,
        modified: row.modified || null,
      });
    }
  }

  // Prefer feedback / assessment quotes first for board packs
  quotes.sort((a, b) => {
    const rank = (q: VoiceQuote) =>
      q.activity === "feedback" ? 0 : q.activity === "assessment" ? 1 : 2;
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return (b.modified || "").localeCompare(a.modified || "");
  });

  return {
    origins: countBuckets(origins),
    industries: countBuckets(industries.length ? industries : ["Not stated"]),
    influence: countBuckets(influenceLevels.map(influenceLabel)),
    sentiments: (
      Object.entries(sentimentCounts) as [SentimentLabel, number][]
    )
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({ label: sentimentLabel(label), value }))
      .sort((a, b) => b.value - a.value),
    quotes: quotes.slice(0, 12),
    perceptionSummary: perceptionSummary(sentimentCounts, quotes.length),
  };
}

export { influenceLabel, sentimentLabel };
