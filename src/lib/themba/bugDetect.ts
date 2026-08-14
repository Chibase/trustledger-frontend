/**
 * Lightweight defect-signal detector for Themba chat (THEMBA-B).
 * Fires on visitor language that suggests the *site or product* is failing,
 * not on marketing talk about broken community processes.
 */

const BUG_PHRASES = [
  "not working",
  "doesn't work",
  "does not work",
  "isn't working",
  "isnt working",
  "can't load",
  "cannot load",
  "failed to",
];

const BUG_WORDS = [
  "broken",
  "error",
  "bug",
  "stuck",
  "crash",
  "glitch",
];

const PRODUCT_HINTS = [
  "trustledger",
  "themba",
  "this page",
  "this site",
  "this website",
  "the widget",
  "the chat",
  "the form",
  "the button",
  "login",
  "sign in",
  "dashboard",
  "checkout",
  "download",
];

const PROCESS_HINTS = [
  "our process",
  "our grievance",
  "community process",
  "whatsapp",
  "spreadsheet",
  "paper forms",
];

const IDIOM_EXCLUSIONS = ["trial and error", "human error", "margin of error"];

function hasWholeWord(haystack: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(
    haystack,
  );
}

export function mentionsBugKeyword(text: string): boolean {
  const q = text.toLowerCase();
  if (IDIOM_EXCLUSIONS.some((p) => q.includes(p))) return false;
  if (BUG_PHRASES.some((p) => q.includes(p))) return true;
  return BUG_WORDS.some((w) => hasWholeWord(q, w));
}

/**
 * True when the visitor appears to be reporting a TrustLedger/site defect.
 * Keyword mention still logs telemetry; this flag drives the in-chat
 * “leave a note” prompt.
 */
export function isProductDefectReport(text: string): boolean {
  if (!mentionsBugKeyword(text)) return false;
  const q = text.toLowerCase();
  if (PROCESS_HINTS.some((p) => q.includes(p))) return false;
  return PRODUCT_HINTS.some((p) => q.includes(p));
}

export const THEMBA_BUG_REPLY =
  "I’ve logged this for the TrustLedger team. If something on this page is failing, leave a work email and a short note and a person will follow up. You can also use Contact.";
