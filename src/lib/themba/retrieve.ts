import {
  thembaKnowledgeCorpus,
  tokenize,
  type ThembaKnowledgeItem,
  type ThembaLink,
} from "@/lib/themba/knowledge";

export type RetrieveResult = {
  item: ThembaKnowledgeItem | null;
  items: ThembaKnowledgeItem[];
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

const TOP_N = 3;
const MATCH_FLOOR = 0.35;
const SUPPORT_FLOOR = 0.18;

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

function uniqueLinks(items: ThembaKnowledgeItem[]): ThembaLink[] {
  const seen = new Set<string>();
  const out: ThembaLink[] = [];
  for (const item of items) {
    for (const link of item.links ?? []) {
      const key = `${link.href}:${link.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(link);
    }
  }
  return out.slice(0, 4);
}

export function retrieveKnowledge(question: string): RetrieveResult {
  const queryTokens = tokenize(question);
  const qLower = question.toLowerCase();
  const corpus = thembaKnowledgeCorpus();

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

  const wantsFramework =
    /\b(social licence|social license|licence to build|framework|advisory architecture)\b/i.test(
      qLower,
    );

  const wantsRapid =
    /\b(rapid.?response|grievance log|log(ging)? a grievance|sla|case desk)\b/i.test(
      qLower,
    );

  const wantsRoi =
    /\b(roi|return on|risk mitigat|compliance|business case)\b/i.test(qLower);

  const wantsMagnet =
    /\b(download|checklist|toolkit|blueprint|printable)\b/i.test(qLower);

  const wantsFunder =
    /\b(funder|investor|dfi|board pack|funder dashboard|funder reporting)\b/i.test(
      qLower,
    );

  const wantsMunicipal =
    /\b(municipality|municipal|mayor|public sector|local government)\b/i.test(
      qLower,
    );

  const wantsEngineer =
    /\b(civil engineer|engineer|site team|epcm)\b/i.test(qLower);

  const wantsPm =
    /\b(project manager|programme manager|program manager)\b/i.test(qLower);

  const wantsDemo =
    /\b(book (a )?(live )?demo|live demo|advisory team|walkthrough)\b/i.test(
      qLower,
    );

  const wantsDashboards =
    /\b(impact dashboard|dashboards?|board pack|funder pack)\b/i.test(qLower);

  const wantsMel =
    /\b(mel|m&e|monitoring|evaluation|learning|logframe|indicator)\b/i.test(
      qLower,
    );

  const wantsFacilitator =
    /\b(facilitat|liaison|clo|public participation|community relations|social performance)\b/i.test(
      qLower,
    );

  const wantsCommunity =
    /\b(community member|host community|traditional (authority|authorities|council)|kgosi|inkosi)\b/i.test(
      qLower,
    );

  const wantsIks =
    /\b(iks|indigenous|customary|local knowledge|lived experience)\b/i.test(
      qLower,
    );

  const wantsGlobal =
    /\b(global south|beyond (south africa|sa)|outside (south africa|sa)|other countr|namibia|botswana|kenya|ghana|nigeria|sadc|africa)\b/i.test(
      qLower,
    );

  const wantsOps =
    /\b(how (do|does|to) (i |we )?(use|operate|run|set up|setup|seed)|operating procedure|user manual|daily loop|first week|seeding)\b/i.test(
      qLower,
    );

  const wantsBlueprint =
    /\b(srm blueprint|six dimension|readiness dimension|maturity dimension)\b/i.test(
      qLower,
    ) || (wantsMagnet && /\bblueprint\b/i.test(qLower));

  const ranked = corpus
    .map((item) => {
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
      if (wantsFramework && item.id === "social-licence-framework") {
        s += 0.6;
      }
      if (wantsRapid && item.id === "rapid-response") {
        s += 0.55;
      }
      if (wantsRoi && item.id === "roi-risk") {
        s += 0.5;
      }
      if (wantsMagnet && item.id === "lead-magnet") {
        s += 0.55;
      }
      if (wantsFunder && item.id === "funder-value") {
        s += 0.5;
      }
      if (wantsMunicipal && (item.id === "municipal-value" || item.id === "za")) {
        s += 0.45;
      }
      if (wantsEngineer && item.id === "engineer-value") {
        s += 0.5;
      }
      if (wantsPm && item.id === "pm-value") {
        s += 0.55;
      }
      if (wantsDemo && item.id === "book-demo") {
        s += 0.6;
      }
      if (wantsDashboards && item.id === "impact-dashboards") {
        s += 0.5;
      }
      if (wantsMel && item.id === "mel-value") {
        s += 0.55;
      }
      if (wantsFacilitator && item.id === "facilitator-value") {
        s += 0.55;
      }
      if (wantsCommunity && item.id === "community-value") {
        s += 0.55;
      }
      if (wantsIks && item.id === "iks-practice") {
        s += 0.7;
      }
      if (wantsGlobal && (item.id === "global-south" || item.id === "za")) {
        s += 0.55;
      }
      if (wantsOps && (item.id === "ops-spine" || item.id === "ops-first-week")) {
        s += 0.6;
      }
      if (wantsBlueprint && item.id === "srm-blueprint") {
        s += 0.65;
      }
      return { item, score: s };
    })
    .sort((a, b) => b.score - a.score);

  const bestScore = ranked[0]?.score ?? 0;
  const primary =
    bestScore >= MATCH_FLOOR && ranked[0] ? ranked[0].item : null;

  const picked: ThembaKnowledgeItem[] = [];
  if (primary) {
    picked.push(primary);
    for (const row of ranked.slice(1)) {
      if (picked.length >= TOP_N) break;
      if (row.score < SUPPORT_FLOOR) break;
      if (picked.some((p) => p.id === row.item.id)) continue;
      picked.push(row.item);
    }
  }

  const skipDocSupport =
    wantsPlans ||
    /\b(login|sign in|subscribe|password|otp|pay|pricing)\b/i.test(qLower);

  if (primary && !skipDocSupport) {
    const byId = new Map(ranked.map((r) => [r.item.id, r]));
    const ensure = (id: string, min: number) => {
      if (picked.some((p) => p.id === id)) return;
      if (picked.length >= TOP_N + 1) return;
      const row = byId.get(id);
      if (row && row.score >= min) picked.push(row.item);
    };
    if (wantsOps || wantsFeatures || wantsRapid || wantsFacilitator) {
      ensure("ops-spine", 0.08);
    }
    if (wantsReadiness || wantsBlueprint || wantsMel || wantsFramework) {
      ensure("srm-blueprint", 0.08);
    }
    if (wantsIks || wantsCommunity || wantsFacilitator || wantsMel) {
      ensure("iks-practice", 0.08);
    }
  }

  return {
    item: primary,
    items: picked,
    score: bestScore,
    links: uniqueLinks(picked),
  };
}
