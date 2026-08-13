import { tokenize } from "@/lib/themba/knowledge";

const ESCALATE_PHRASES = [
  "speak to",
  "talk to",
  "human",
  "real person",
  "call me",
  "contact sales",
  "sales team",
  "account manager",
  "lawyer",
  "legal",
  "contract",
  "nda",
  "invoice",
  "refund",
  "chargeback",
  "billing dispute",
  "password reset",
  "hacked",
  "breach",
  "popia complaint",
  "delete my data",
  "my incident",
  "my case",
  "my grievance",
];

const OUT_OF_SCOPE = [
  "write code",
  "hack",
  "exploit",
  "malware",
  "weapon",
];

export function wantsHuman(question: string): boolean {
  const q = question.toLowerCase();
  return ESCALATE_PHRASES.some((p) => q.includes(p));
}

export function isOutOfScope(question: string): boolean {
  const q = question.toLowerCase();
  return OUT_OF_SCOPE.some((p) => q.includes(p));
}

/** Low retrieval confidence or explicit escalate → handoff. */
export function shouldEscalate(
  question: string,
  retrieveScore: number,
): boolean {
  if (wantsHuman(question) || isOutOfScope(question)) return true;
  if (retrieveScore < 0.35) return true;
  const tokens = tokenize(question).filter((t) => t.length > 2);
  if (tokens.length >= 14 && retrieveScore < 0.55) return true;
  return false;
}
