import { FRAPPE_METHODS } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import type {
  DraftResponseRequest,
  DraftResponseSuggestion,
  IncidentTriageSuggestion,
  ReportBriefRequest,
  ReportBriefSuggestion,
  SentimentRequest,
  SentimentSuggestion,
  TriageRequest,
} from "@/types/ai";

const USE_MOCK =
  process.env.NEXT_PUBLIC_AI_MOCK !== "false" &&
  process.env.NEXT_PUBLIC_AI_MOCK !== "0";

const MODEL = "grok-4.5";
const PROMPT_VERSION = "srm-ai-v0";

function delay(ms = 650) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockTriage(input: TriageRequest): IncidentTriageSuggestion {
  const text = input.description.toLowerCase();
  const isWater = /water|pipe|leak|flood/.test(text);
  const isSafety = /safety|injury|accident|danger|unsafe|trench/.test(text);
  const isDust = /dust/.test(text);
  const isNoise = /noise|blast|night work/.test(text);
  const isDisgruntlement =
    /disgruntl|protest|angry|community unrest|boycott/.test(text);
  const isEmployment = /job|employ|labour|labor|hiring/.test(text);
  const isLand = /land|resettle|expropriat/.test(text);
  const isEnv = /pollut|spill|environment|chemical/.test(text);

  let category = "General grievance";
  let natureId = "other";
  let suggestedPriority: IncidentTriageSuggestion["suggestedPriority"] =
    "P3-Medium";
  const impactHints: string[] = ["Community relations"];

  if (isSafety) {
    category = "Safety / access hazard";
    natureId = "safety";
    suggestedPriority = "P1-Critical";
    impactHints.push("Public safety", "Reputation");
  } else if (isWater) {
    category = "Water / utilities disruption";
    natureId = "water";
    suggestedPriority = "P2-High";
    impactHints.push("Livelihood access", "Service delivery");
  } else if (isDisgruntlement) {
    category = "Community relations / unrest";
    natureId = "community_disgruntlement";
    suggestedPriority = "P1-Critical";
    impactHints.push("Social licence", "Reputation");
  } else if (isDust && isNoise) {
    category = "Construction nuisance";
    natureId = "dust";
    suggestedPriority = "P2-High";
    impactHints.push("Amenity", "Health & wellbeing");
  } else if (isDust) {
    category = "Construction nuisance — dust";
    natureId = "dust";
    suggestedPriority = "P3-Medium";
    impactHints.push("Amenity", "Health & wellbeing");
  } else if (isNoise) {
    category = "Construction nuisance — noise";
    natureId = "noise";
    suggestedPriority = "P3-Medium";
    impactHints.push("Amenity", "Health & wellbeing");
  } else if (isEmployment) {
    category = "Local employment / labour";
    natureId = "employment";
    suggestedPriority = "P2-High";
    impactHints.push("Livelihoods", "Social licence");
  } else if (isLand) {
    category = "Land / resettlement";
    natureId = "land";
    suggestedPriority = "P1-Critical";
    impactHints.push("Rights", "Regulatory");
  } else if (isEnv) {
    category = "Environment / pollution";
    natureId = "environment";
    suggestedPriority = "P2-High";
    impactHints.push("Environment", "Regulatory");
  }

  const needsSenior =
    suggestedPriority === "P1-Critical" || suggestedPriority === "P2-High";

  return {
    summary:
      input.description.trim().slice(0, 140) ||
      "Community-reported concern requiring triage.",
    category,
    natureId,
    geographicAreaHint: input.ward || "Ward 12",
    suggestedPriority,
    suggestedStaffTier: needsSenior ? "senior" : "junior",
    escalationRationale: needsSenior
      ? `${suggestedPriority} — escalate to senior per typical client threshold (P2+).`
      : `${suggestedPriority} — junior staff may handle under typical client policy.`,
    impactHints,
    languageDetected: "en",
    translatedDescription: undefined,
    confidence: 0.78,
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  };
}

function mockSentiment(input: SentimentRequest): SentimentSuggestion {
  const text = input.text.toLowerCase();
  let sentimentScore = -20;
  if (/angry|furious|threat|protest|unsafe/.test(text)) sentimentScore = -75;
  else if (/concern|worried|delay|broken/.test(text)) sentimentScore = -45;
  else if (/thank|appreciate|resolved|good/.test(text)) sentimentScore = 55;

  return {
    sentimentScore,
    confidenceScore: 0.72,
    rationale:
      "Demo intensity estimate from wording cues. Live mode uses TrustLedger Cloud AI.",
    sourceType: input.sourceType ?? "Other",
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  };
}

function mockDraft(input: DraftResponseRequest): DraftResponseSuggestion {
  return {
    draft: `Thank you for raising this concern about the project in your area.

We have logged your report and assigned it for review. Our team will investigate and share an update within the applicable response window.

If you have photos, meeting references, or additional details, please reply to this message so we can attach them to the case record.

TrustLedger Community Desk`,
    tone: input.audience === "community" ? "empathetic" : "formal",
    language: input.language || "en",
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  };
}

function mockReportBrief(input: ReportBriefRequest): ReportBriefSuggestion {
  return {
    title: "Stakeholder risk brief (draft)",
    executiveSummary:
      "Open community concerns are concentrated around service disruption and site access. Priority scoring currently blends impact taxonomy with recent sentiment captures. This draft is for human review before board circulation.",
    keyRisks: [
      "Unresolved high-priority incidents near active wards",
      "Sentiment intensity elevating SLA pressure",
      "Evidence gaps on closed-critical residual risk cases",
    ],
    recommendedActions: [
      "Confirm owners and investigation tasks on P1/P2 incidents",
      "Link latest community meeting notes to sentiment captures",
      "Prepare assurance pack with timeline citations",
    ],
    citedIncidentIds: input.incidentIds ?? ["INC-1001", "INC-1004"],
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  };
}

export const aiService = {
  isMockMode(): boolean {
    return USE_MOCK;
  },

  async suggestTriage(input: TriageRequest): Promise<IncidentTriageSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockTriage(input);
    }
    return callFrappeMethod(FRAPPE_METHODS.suggestTriage, { ...input });
  },

  async suggestSentiment(input: SentimentRequest): Promise<SentimentSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockSentiment(input);
    }
    return callFrappeMethod(FRAPPE_METHODS.suggestSentiment, { ...input });
  },

  async draftResponse(
    input: DraftResponseRequest,
  ): Promise<DraftResponseSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockDraft(input);
    }
    return callFrappeMethod(FRAPPE_METHODS.draftResponse, { ...input });
  },

  async generateReportBrief(
    input: ReportBriefRequest,
  ): Promise<ReportBriefSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockReportBrief(input);
    }
    return callFrappeMethod(FRAPPE_METHODS.generateReportBrief, { ...input });
  },
};
