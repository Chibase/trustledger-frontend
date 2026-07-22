import { FRAPPE_METHODS } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import {
  composeActivityReportMarkdown,
  looksLikeReportTemplateGuide,
  type PeriodActivityFacts,
} from "@/lib/reportComposer";
import type { ReportSectionId } from "@/types/activityReport";
import { REPORT_SECTION_IDS } from "@/types/activityReport";
import type {
  DraftResponseRequest,
  DraftResponseSuggestion,
  IncidentTriageSuggestion,
  ReportBriefRequest,
  ReportBriefSuggestion,
  SentimentRequest,
  SentimentSuggestion,
  StakeholderExtractRequest,
  StakeholderExtractSuggestion,
  ActivityReportComposeRequest,
  ActivityReportComposeSuggestion,
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
  const fromSource = input.sourceText?.trim();
  if (fromSource) {
    const snippet = fromSource.slice(0, 180);
    return {
      title: input.sourceLabel
        ? `Brief from ${input.sourceLabel}`
        : "Engagement brief (draft)",
      executiveSummary: `Based on the submitted text: ${snippet}${fromSource.length > 180 ? "…" : ""} Key themes include community relations, delivery risk, and follow-up actions for human review.`,
      keyRisks: [
        "Unresolved concerns referenced in the source text",
        "Attendance or influence gaps if stakeholders were not followed up",
        "Sentiment intensity may elevate SLA pressure on linked cases",
      ],
      recommendedActions: [
        "Confirm owners for actions noted in the source",
        "Apply suggested stakeholders to the CRM after review",
        "Link the capture record to the project and open grievances",
      ],
      citedIncidentIds: input.incidentIds ?? [],
      model: MODEL,
      promptVersion: PROMPT_VERSION,
    };
  }
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

function mockActivityReport(
  input: ActivityReportComposeRequest,
): ActivityReportComposeSuggestion {
  let facts: PeriodActivityFacts | null = null;
  if (input.factsJson) {
    try {
      facts = JSON.parse(input.factsJson) as PeriodActivityFacts;
    } catch {
      facts = null;
    }
  }

  // Minimal facts so we still write a real report if JSON is missing.
  if (!facts) {
    facts = {
      attended: [],
      escalated: [],
      resolved: [],
      pending: [],
      unresolvedBlocked: [],
      meetingCaptures: [],
      evidence: [
        {
          id: "ev-fallback",
          kind: "other",
          label: "Workspace evidence block (see facts)",
        },
      ],
      trustIndex: 50,
      trustLabel: "Unknown",
      avgSentiment: null,
      projectName: input.projectName,
    };
  }

  const sectionIds = (input.includedSectionIds || []).filter(
    (id): id is ReportSectionId =>
      (REPORT_SECTION_IDS as readonly string[]).includes(id),
  );

  const ids: ReportSectionId[] =
    sectionIds.length > 0
      ? sectionIds
      : (["period_summary", "issues_attended", "appendix_evidence"] as ReportSectionId[]);

  const labels =
    input.includedSectionLabels.length >= ids.length
      ? input.includedSectionLabels
      : ids.map((id) => id.replaceAll("_", " "));

  const composed = composeActivityReportMarkdown({
    kindLabel: input.kindLabel,
    audienceLabel: input.audienceLabel,
    periodLabel: input.periodLabel,
    authorTierLabel: input.authorTierLabel,
    authorName: input.authorName,
    projectName: input.projectName,
    includedSectionIds: ids,
    includedSectionLabels: labels.slice(0, ids.length),
    lockedSectionLabels: input.lockedSectionLabels,
    facts,
    tonePreference: input.tonePreference,
  });

  return {
    title: composed.title,
    bodyMarkdown: composed.bodyMarkdown,
    executiveHighlight: composed.executiveHighlight,
    confidence: 0.88,
    model: `${MODEL}-evidence`,
    promptVersion: `${PROMPT_VERSION}-compose-evidence`,
  };
}

function mockStakeholderExtract(
  input: StakeholderExtractRequest,
): StakeholderExtractSuggestion {
  const text = input.text;
  const lines = text
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2);
  const names: string[] = [];
  for (const line of lines) {
    const titled = line.match(
      /(?:Chief|Inkosi|Mr|Mrs|Ms|Dr|Councillor|Cllr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    );
    if (titled?.[0]) names.push(titled[0]);
    const plain = line.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
    if (plain?.[1] && !names.includes(plain[1])) names.push(plain[1]);
    if (names.length >= 5) break;
  }
  if (!names.length) {
    names.push("Community representative", "Ward committee member");
  }
  const isTraditional = /chief|inkosi|traditional|council/i.test(text);
  const isGov = /municipality|councillor|department|dmr|dws/i.test(text);
  const isSocial = input.source === "social_intel";

  return {
    stakeholders: names.slice(0, 5).map((name, i) => ({
      name,
      kind: isTraditional
        ? "traditional_authority"
        : isGov
          ? "government"
          : isSocial
            ? "community_group"
            : i === 0
              ? "individual"
              : "community_group",
      organisation: input.projectName,
      influence: i === 0 ? "high" : "medium",
      rationale: `Mentioned or implied in ${input.source.replaceAll("_", " ")}.`,
    })),
    briefTitle: `Capture brief (${input.source.replaceAll("_", " ")})`,
    briefSummary: `Extracted ${Math.min(names.length, 5)} stakeholder candidates from the source for human review before CRM apply.`,
    confidence: 0.7,
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

  async suggestStakeholdersFromText(
    input: StakeholderExtractRequest,
  ): Promise<StakeholderExtractSuggestion> {
    if (USE_MOCK) {
      await delay();
      return mockStakeholderExtract(input);
    }
    return callFrappeMethod(FRAPPE_METHODS.suggestStakeholdersFromText, {
      ...input,
    });
  },

  async composeActivityReport(
    input: ActivityReportComposeRequest,
  ): Promise<ActivityReportComposeSuggestion> {
    // Evidence writer only — never call Cloud LLM for activity reports.
    // Live Grok/srm-core prompts have been returning how-to templates with
    // placeholders like [Month/Year] and no case IDs from demo data.
    await delay(450);
    const local = mockActivityReport(input);
    if (looksLikeReportTemplateGuide(local.bodyMarkdown)) {
      throw new Error("Composer refused to return a template guide.");
    }
    if (!local.bodyMarkdown.includes("INC-") && input.factsJson?.includes("INC-")) {
      throw new Error("Composer did not cite workspace case evidence.");
    }
    return local;
  },
};
