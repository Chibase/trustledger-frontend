import type { MarketingPayload } from "@/lib/marketing/types";

const START = "TL_MKT_PAYLOAD:START";
const END = "TL_MKT_PAYLOAD:END";

export function encodePayload(payload: MarketingPayload): string {
  return `${START}\n${JSON.stringify(payload, null, 2)}\n${END}`;
}

export function decodePayload(text: string | undefined | null): MarketingPayload | null {
  if (!text) return null;
  const block = text.match(
    new RegExp(`${START}\\s*([\\s\\S]*?)\\s*${END}`),
  );
  const raw = block?.[1]?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MarketingPayload;
    if (parsed?.v !== 1 || !parsed.asset?.body || !parsed.sourceSlug) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function overlayHumanEdits(
  markdown: string,
  payload: MarketingPayload,
): MarketingPayload {
  const visible = markdown.split(START)[0] || markdown;
  const headline = section(visible, "Headline");
  const body = section(visible, "Post body");
  const firstComment = section(visible, "First comment");
  const outreach = section(visible, "Outreach draft \\(not auto-sent\\)");
  const hashtagsRaw = section(visible, "Hashtags");
  const hooksRaw = section(visible, "Hooks");
  const ctaRaw = section(visible, "CTA");

  const asset = { ...payload.asset };
  if (headline) asset.headline = headline;
  if (body) asset.body = body;
  if (firstComment) asset.firstComment = firstComment;
  if (outreach) asset.outreachDraft = outreach;
  if (hashtagsRaw) {
    asset.hashtags = hashtagsRaw
      .split(/[\s,]+/)
      .map((h) => h.replace(/^#/, "").trim())
      .filter(Boolean);
  }
  if (hooksRaw) {
    asset.hooks = hooksRaw
      .split(/\n/)
      .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
      .filter((l) => l && l !== "_none_");
  }
  if (ctaRaw) {
    const m = ctaRaw.match(/\[([^\]]+)\]\((https?:[^)\s]+)\)/);
    if (m) asset.cta = { label: m[1], url: m[2] };
  }
  return { ...payload, asset };
}

function section(text: string, heading: string): string | null {
  const re = new RegExp(
    `### ${heading}\\s*\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`,
    "i",
  );
  const m = text.match(re);
  if (!m) return null;
  const v = m[1].trim();
  if (!v || v === "_none_") return null;
  return v;
}

export function encodeTaskMarkdown(input: {
  payload: MarketingPayload;
  sourceTitle: string;
  synthesizer: string;
}): string {
  const { payload } = input;
  const hooks = payload.asset.hooks.map((h) => `- ${h}`).join("\n");
  const tags = payload.asset.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
  const published = payload.publishedAt
    ? `\n\n**Published:** ${payload.publishedAt}${
        payload.zernioPostId ? ` · Zernio \`${payload.zernioPostId}\`` : ""
      }`
    : "";
  return `## ${payload.brand === "chibase" ? "Chibase" : "TrustLedger"} draft for review

**Source:** ${input.sourceTitle} (\`${payload.sourceSlug}\`)
**Week:** ${payload.weekKey}
**Kind:** ${payload.kind}
**Synthesizer:** ${input.synthesizer}

### How to publish
1. Edit the **Headline / Post body / CTA / First comment** sections (those are what publish). Keep Trust voice. No stack vendor names.
2. Set status to **Approved**, **or** comment \`/tl-publish\`.
3. Email blasts are **not** sent from this list — Frappe Newsletter only.

### Headline
${payload.asset.headline}

### Post body
${payload.asset.body}

### Hooks
${hooks || "_none_"}

### Hashtags
${tags || "_none_"}

### CTA
[${payload.asset.cta.label}](${payload.asset.cta.url})

### First comment
${payload.asset.firstComment || "_none_"}

${
  payload.asset.outreachDraft
    ? `### Outreach draft (not auto-sent)\n${payload.asset.outreachDraft}\n`
    : ""
}
${published}

---
\`\`\`
${encodePayload(payload)}
\`\`\`
`;
}
