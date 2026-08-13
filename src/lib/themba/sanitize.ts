const BANNED: Array<{ re: RegExp; replacement: string }> = [
  { re: /\bFrappe\b/gi, replacement: "TrustLedger Cloud" },
  { re: /\bVercel\b/gi, replacement: "the TrustLedger product app" },
  { re: /\bHubSpot\b/gi, replacement: "our CRM" },
  { re: /\bInterserv\b/gi, replacement: "TrustLedger Cloud" },
  { re: /\bAccordBridge\b/gi, replacement: "TrustLedger" },
];

/** Strip stack brands from public agent copy (ADR-039 / ADR-042). */
export function sanitizeThembaText(text: string): string {
  let out = text;
  for (const { re, replacement } of BANNED) {
    out = out.replace(re, replacement);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}
