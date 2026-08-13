import { tokenize } from "@/lib/themba/knowledge";

/** Multi-word phrases matched as substrings (case-insensitive). */
const ESCALATE_PHRASES = [
  "speak to",
  "talk to",
  "talk with",
  "real person",
  "call me",
  "contact sales",
  "sales team",
  "account manager",
  "billing dispute",
  "password reset",
  "popia complaint",
  "delete my data",
  "my incident",
  "my case",
  "my grievance",
  "speak with someone",
  "need a person",
  "need someone",
];

/** Whole-word tokens only — avoid matching inside “AI Assist”, “contractor”, etc. */
const ESCALATE_WORDS = new Set([
  "human",
  "lawyer",
  "legal",
  "contract",
  "contracts",
  "nda",
  "invoice",
  "refund",
  "chargeback",
  "hacked",
  "breach",
]);

const OUT_OF_SCOPE_PHRASES = [
  "write code",
  "exploit",
  "malware",
];

function hasWholeWord(haystack: string, word: string): boolean {
  const re = new RegExp(`(?:^|[^a-z0-9])${word}(?:[^a-z0-9]|$)`, "i");
  return re.test(haystack);
}

export function wantsHuman(question: string): boolean {
  const q = question.toLowerCase();
  if (ESCALATE_PHRASES.some((p) => q.includes(p))) return true;
  return [...ESCALATE_WORDS].some((w) => hasWholeWord(q, w));
}

export function isOutOfScope(question: string): boolean {
  const q = question.toLowerCase();
  return OUT_OF_SCOPE_PHRASES.some((p) => q.includes(p));
}

/**
 * Escalate on explicit human/legal intent, out-of-scope, or low retrieval.
 * High-confidence FAQ matches win over weak token noise.
 */
export function shouldEscalate(
  question: string,
  retrieveScore: number,
): boolean {
  if (isOutOfScope(question)) return true;
  if (wantsHuman(question)) return true;
  if (retrieveScore >= 0.55) return false;
  if (retrieveScore < 0.35) return true;
  const tokens = tokenize(question).filter((t) => t.length > 2);
  if (tokens.length >= 14 && retrieveScore < 0.55) return true;
  return false;
}
