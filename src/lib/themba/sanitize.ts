const BANNED: Array<{ re: RegExp; replacement: string }> = [
  { re: /\bFrappe\s+Cloud\b/gi, replacement: "TrustLedger Cloud" },
  { re: /\bFrappe\b/gi, replacement: "TrustLedger Cloud" },
  { re: /\bVercel\b/gi, replacement: "the TrustLedger product app" },
  { re: /\bHubSpot\b/gi, replacement: "our CRM" },
  { re: /\bInterserv\b/gi, replacement: "TrustLedger Cloud" },
  { re: /\bAccordBridge\b/gi, replacement: "TrustLedger" },
  { re: /\bVersion 00[123]\b/gi, replacement: "TrustLedger" },
  { re: /\bV00[123]\b/gi, replacement: "TrustLedger" },
  { re: /\bfull TEDS blueprint\b/gi, replacement: "the full product blueprint" },
  { re: /\bTEDS blueprint\b/gi, replacement: "product blueprint" },
  { re: /\bTEDS\b/g, replacement: "our internal engineering series" },
];

/** Strip stack brands from public agent copy (ADR-039 / ADR-042). */
export function sanitizeThembaText(text: string): string {
  let out = text;
  for (const { re, replacement } of BANNED) {
    out = out.replace(re, replacement);
  }
  return out
    .replace(/\bTrustLedger Cloud Cloud\b/gi, "TrustLedger Cloud")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
