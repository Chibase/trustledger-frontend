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
]);

function scoreItem(queryTokens: string[], item: ThembaKnowledgeItem): number {
  if (queryTokens.length === 0) return 0;
  const hay = new Set([
    ...tokenize(item.question),
    ...tokenize(item.answer),
    ...item.keywords.map((k) => k.toLowerCase()),
  ]);
  let hits = 0;
  for (const t of queryTokens) {
    if (STOP.has(t)) continue;
    if (hay.has(t)) {
      hits += 1;
      continue;
    }
    for (const h of hay) {
      if (h.includes(t) || t.includes(h)) {
        hits += 0.5;
        break;
      }
    }
  }
  const meaningful = queryTokens.filter((t) => !STOP.has(t)).length || 1;
  return hits / meaningful;
}

export function retrieveKnowledge(question: string): RetrieveResult {
  const queryTokens = tokenize(question);
  const corpus = thembaKnowledgeCorpus();
  let best: ThembaKnowledgeItem | null = null;
  let bestScore = 0;

  for (const item of corpus) {
    const s = scoreItem(queryTokens, item);
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
