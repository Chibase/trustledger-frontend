/**
 * Communication-note sentiment for SRM: positive / neutral / negative.
 * Heuristic when Cloud AI is mocked or unreachable. Human apply still required.
 */

import type { SentimentLabel } from "@/types/ai";

export type { SentimentLabel };
export const SENTIMENT_LABELS: SentimentLabel[] = [
  "positive",
  "neutral",
  "negative",
];

export type NoteSentimentResult = {
  label: SentimentLabel;
  score: number;
  confidence: number;
  rationale: string;
  cues: string[];
};

export type RelationshipHealth = {
  positive: number;
  neutral: number;
  negative: number;
  unlabeled: number;
  sampleSize: number;
  avgScore: number | null;
  warning: "ok" | "watch" | "alert";
  headline: string;
};

export const SENTIMENT_LABEL_COPY: Record<SentimentLabel, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

const POSITIVE: Array<{ re: RegExp; weight: number; cue: string }> = [
  { re: /\b(thank(?:s| you)?|appreciat(?:e|ed|ion))\b/i, weight: 28, cue: "appreciation" },
  { re: /\b(support(?:ive|ed)?|welcome[d]?|endorsed|consensus)\b/i, weight: 24, cue: "support" },
  { re: /\b(resolved|progress|improved?|success(?:ful)?)\b/i, weight: 22, cue: "progress" },
  { re: /\b(constructive|cooperative|collaborat(?:e|ed|ion)|partnership)\b/i, weight: 20, cue: "cooperation" },
  { re: /\b(satisfied|productive|cordial|respectful|helpful)\b/i, weight: 18, cue: "constructive tone" },
  { re: /\b(agreed|agreement|commitment honoured)\b/i, weight: 16, cue: "agreement" },
  { re: /\b(trust|confident|good faith)\b/i, weight: 16, cue: "trust" },
  { re: /\bdankie\b/i, weight: 22, cue: "appreciation (Afrikaans)" },
];

const NEGATIVE: Array<{ re: RegExp; weight: number; cue: string }> = [
  { re: /\b(angry|furious|outrage|hostile|woedend)\b/i, weight: 32, cue: "anger" },
  { re: /\b(protest(?:s|ers|ing)?|toyi-?toyi|walkout|boycott|picket|strike)\b/i, weight: 30, cue: "protest" },
  { re: /\b(threat(?:en(?:ed|ing)?)?|unrest|violence|violent)\b/i, weight: 30, cue: "threat / unrest" },
  { re: /\b(unsafe|danger(?:ous)?|injury)\b/i, weight: 26, cue: "safety" },
  { re: /\b(distrust|no consultation|not consulted|ignored|neglect(?:ed)?)\b/i, weight: 24, cue: "exclusion" },
  { re: /\b(frustrated|unhappy|dissatisfied|complain(?:t|ts|ed|ing)?)\b/i, weight: 20, cue: "dissatisfaction" },
  { re: /\b(delay(?:ed|s)?|broken promise|not honou?red|failed|failure)\b/i, weight: 18, cue: "delay / broken promise" },
  { re: /\b(flood(?:ing)?|blocked|refus(?:e|ed|al)|grievance)\b/i, weight: 16, cue: "disruption" },
  { re: /\b(concern(?:ed)?|worri(?:ed|es)|worried)\b/i, weight: 12, cue: "concern" },
  { re: /\b(noise|dust|nuisance)\b/i, weight: 8, cue: "nuisance" },
];

function clampScore(n: number): number {
  return Math.max(-100, Math.min(100, Math.round(n)));
}

export function sentimentLabelFromScore(score: number): SentimentLabel {
  if (score >= 20) return "positive";
  if (score <= -20) return "negative";
  return "neutral";
}

export function scoreFromSentimentLabel(label: SentimentLabel): number {
  if (label === "positive") return 55;
  if (label === "negative") return -55;
  return 0;
}

/** Title + summary + action items — the communication note body. */
export function communicationNoteText(input: {
  title?: string;
  summary?: string;
  description?: string;
  actionItems?: string[];
}): string {
  const parts = [
    input.title?.trim(),
    input.summary?.trim(),
    input.description?.trim(),
    ...(input.actionItems || []).map((item) => item.trim()),
  ].filter(Boolean);
  return parts.join("\n");
}

export function analyzeCommunicationNote(text: string): NoteSentimentResult {
  const body = text.replace(/\s+/g, " ").trim();
  if (!body) {
    return {
      label: "neutral",
      score: 0,
      confidence: 0.2,
      rationale: "No note text to analyse — treat as unlabeled until notes are captured.",
      cues: [],
    };
  }

  let score = 0;
  const cues: string[] = [];
  for (const row of POSITIVE) {
    if (row.re.test(body)) {
      score += row.weight;
      cues.push(row.cue);
    }
  }
  for (const row of NEGATIVE) {
    if (row.re.test(body)) {
      score -= row.weight;
      cues.push(row.cue);
    }
  }

  score = clampScore(score);
  const label = sentimentLabelFromScore(score);
  const cueCount = cues.length;
  const confidence = Math.min(0.92, 0.42 + cueCount * 0.1);

  const uniqueCues = [...new Set(cues)];
  const cueBit = uniqueCues.length
    ? `Cues: ${uniqueCues.join(", ")}.`
    : "No strong wording cues — defaulting to neutral.";
  const rationale = `${SENTIMENT_LABEL_COPY[label]} relationship signal from this communication note (${score} on −100…100). ${cueBit} Suggestion only — apply to save it on the relationship-health pulse.`;

  return { label, score, confidence, rationale, cues: uniqueCues };
}

export function relationshipHealthFromLabels(
  labels: Array<SentimentLabel | null | undefined>,
  scores: Array<number | null | undefined> = [],
): RelationshipHealth {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let unlabeled = 0;
  const numeric: number[] = [];

  labels.forEach((label, i) => {
    const score = scores[i];
    if (typeof score === "number") numeric.push(score);
    if (label === "positive") positive += 1;
    else if (label === "neutral") neutral += 1;
    else if (label === "negative") negative += 1;
    else unlabeled += 1;
  });

  const sampleSize = positive + neutral + negative;
  const avgScore =
    numeric.length === 0
      ? null
      : Math.round(numeric.reduce((s, n) => s + n, 0) / numeric.length);

  let warning: RelationshipHealth["warning"] = "ok";
  let headline =
    "No communication notes scored yet. Open a meeting note and run one-click sentiment analysis.";

  if (sampleSize > 0) {
    const negShare = negative / sampleSize;
    if (negShare >= 0.5 && negative > positive) {
      warning = "alert";
      headline = `Early warning: ${negative} of ${sampleSize} scored notes are negative. Leadership should review community relationship health.`;
    } else if (negative > 0) {
      warning = "watch";
      headline = `Watch: mixed or declining notes (${negative} negative of ${sampleSize} scored). Keep engaging before this corridor hardens.`;
    } else {
      warning = "ok";
      headline = `Relationship health is stable: ${positive} positive, ${neutral} neutral, ${negative} negative across ${sampleSize} scored notes.`;
    }
  }

  return {
    positive,
    neutral,
    negative,
    unlabeled,
    sampleSize,
    avgScore,
    warning,
    headline,
  };
}
