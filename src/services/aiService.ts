import { API_BASE_URL } from "@/config/api";
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

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`AI request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function delay(ms = 650) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockTriage(input: TriageRequest): IncidentTriageSuggestion {
  const text = input.description.toLowerCase();
  const isWater = /water|pipe|leak|flood/.test(text);
  const isSafety = /safety|injury|accident|danger|road/.test(text);
  const isNoise = /noise|dust|blast/.test(text);

  let category = "General grievance";
  let suggestedPriority: IncidentTriageSuggestion["suggestedPriority"] =
    "P3-Medium";
  const impactHints: string[] = ["Community relations"];

  if (isWater) {
    category = "Water / utilities disruption";
    suggestedPriority = "P2-High";
    impactHints.push("Livelihood access", "Service delivery");
  } else if (isSafety) {
    category = "Safety / access hazard";
    suggestedPriority = "P1-Critical";
    impactHints.push("Public safety", "Reputation");
  } else if (isNoise) {
    category = "Construction nuisance";
    suggestedPriority = "P3-Medium";
    impactHints.push("Amenity", "Health & wellbeing");
  }

  return {
    summary:
      input.description.trim().slice(0, 140) ||
      "Community-reported concern requiring triage.",
    category,
    geographicAreaHint: input.ward || "Ward 12",
    suggestedPriority,
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
      "Mock intensity estimate from wording cues. Replace with Grok scoring in srm-core.",
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
    return postJson("/api/method/srm_core.api.ai.suggest_triage", input);
  },

  async suggestSentiment(input: SentimentRequest): Promise<SentimentSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockSentiment(input);
    }
    return postJson("/api/method/srm_core.api.ai.suggest_sentiment", input);
  },

  async draftResponse(
    input: DraftResponseRequest,
  ): Promise<DraftResponseSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockDraft(input);
    }
    return postJson("/api/method/srm_core.api.ai.draft_response", input);
  },

  async generateReportBrief(
    input: ReportBriefRequest,
  ): Promise<ReportBriefSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockReportBrief(input);
    }
    return postJson("/api/method/srm_core.api.ai.generate_report_brief", input);
  },
};
