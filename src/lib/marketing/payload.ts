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
1. Edit the post body below. Keep Trust voice. No stack vendor names.
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
