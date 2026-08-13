import {
  thembaKnowledgeCorpus,
  tokenize,
  type ThembaKnowledgeItem,
  type ThembaLink,
} from "@/lib/themba/knowledge";

export type RetrieveResult = {
  item: ThembaKnowledgeItem | null;
  score: number;
  links: ThembaLink[];
};

const STOP = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "do",
  "does",
  "can",
  "i",
  "you",
  "we",
  "my",
  "me",
  "to",
  "of",
  "and",
  "or",
  "for",
  "on",
  "in",
  "with",
  "what",
  "how",
  "where",
  "when",
  "why",
  "please",
  "tell",
  "about",
  "this",
  "that",
  "our",
  "your",
]);

function hitWeight(
  queryToken: string,
  questionTokens: Set<string>,
  keywordTokens: Set<string>,
  answerTokens: Set<string>,
): number {
  if (keywordTokens.has(queryToken) || questionTokens.has(queryToken)) {
    return 1.25;
  }
  for (const h of keywordTokens) {
    if (h.includes(queryToken) || queryToken.includes(h)) return 1;
  }
  for (const h of questionTokens) {
    if (h.includes(queryToken) || queryToken.includes(h)) return 0.9;
  }
  // Answer body is weak signal only — avoids “Learn features…” stealing feature Qs.
  if (answerTokens.has(queryToken)) return 0.2;
  for (const h of answerTokens) {
    if (h.length > 3 && (h.includes(queryToken) || queryToken.includes(h))) {
      return 0.15;
    }
  }
  return 0;
}

function scoreItem(queryTokens: string[], item: ThembaKnowledgeItem): number {
  if (queryTokens.length === 0) return 0;
  const questionTokens = new Set(tokenize(item.question));
  const keywordTokens = new Set(
    item.keywords.flatMap((k) => tokenize(k)).map((k) => k.toLowerCase()),
  );
  const answerTokens = new Set(tokenize(item.answer));

  let hits = 0;
  for (const t of queryTokens) {
    if (STOP.has(t)) continue;
    hits += hitWeight(t, questionTokens, keywordTokens, answerTokens);
  }
  const meaningful = queryTokens.filter((t) => !STOP.has(t)).length || 1;
  return hits / meaningful;
}

export function retrieveKnowledge(question: string): RetrieveResult {
  const queryTokens = tokenize(question);
  const qLower = question.toLowerCase();
  const corpus = thembaKnowledgeCorpus();
  let best: ThembaKnowledgeItem | null = null;
  let bestScore = 0;

  const wantsFeatures =
    /\b(features?|capabilities|modules|what('s| is| are) (in|included)|product (overview|capabilities))\b/i.test(
      qLower,
    ) ||
    /\bwhat can (trustledger|this|it|the product)\b/i.test(qLower) ||
    /\bhow can (trustledger|this|it)\b/i.test(qLower) ||
    /\b(how does (trustledger|this|it) help|benefits? of (trustledger|this|the product))\b/i.test(
      qLower,
    );

  const wantsReadiness =
    /\b(suitable|suitability|readiness|diagnostic|assessment|maturity|right (fit|for us)|good fit)\b/i.test(
      qLower,
    );

  const wantsPlans =
    /\b(plans?|pricing|solo|practitioner|institutional|subscribe|subscription|sku|tier)\b/i.test(
      qLower,
    );

  const wantsCrm =
    /\b(crm|stakeholder (crm|registry|intelligence)|engagements?|commitments?)\b/i.test(
      qLower,
    ) && !/\b(features?|capabilities)\b/i.test(qLower);

  for (const item of corpus) {
    let s = scoreItem(queryTokens, item);
    if (wantsFeatures && (item.id === "features" || item.id === "how-helps")) {
      s += 0.45;
    }
    if (wantsReadiness && item.id === "readiness-guide") {
      s += 0.5;
    }
    if (wantsPlans && (item.id === "plans" || item.id === "subscribe")) {
      s += 0.5;
    }
    if (wantsCrm && (item.id === "crm-real" || item.id === "versions")) {
      s += 0.55;
    }
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }

  return {
    item: bestScore >= 0.35 ? best : null,
    score: bestScore,
    links: bestScore >= 0.35 && best?.links ? best.links : [],
  };
}
