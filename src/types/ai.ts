/**
 * Contracts for continuous AI features.
 * Backend target: srm-core whitelisted methods (Grok via xAI API).
 * Frontend never calls the LLM provider directly.
 */

export type AiSuggestionStatus = "idle" | "loading" | "ready" | "error";

export type IncidentTriageSuggestion = {
  summary: string;
  category: string;
  /** Structured complaint nature id when recognised. */
  natureId?: string;
  geographicAreaHint: string;
  suggestedPriority: "P4-Low" | "P3-Medium" | "P2-High" | "P1-Critical";
  /** junior | senior — based on priority vs client threshold (applied client-side too). */
  suggestedStaffTier?: "junior" | "senior";
  escalationRationale?: string;
  impactHints: string[];
  languageDetected: string;
  translatedDescription?: string;
  confidence: number;
  model: string;
  promptVersion: string;
};

export type SentimentSuggestion = {
  sentimentScore: number;
  confidenceScore: number;
  rationale: string;
  sourceType: "Survey" | "Interview" | "Community Meeting" | "Social Media" | "Other";
  model: string;
  promptVersion: string;
};

export type DraftResponseSuggestion = {
  draft: string;
  tone: "formal" | "plain" | "empathetic";
  language: string;
  model: string;
  promptVersion: string;
};

export type ReportBriefSuggestion = {
  title: string;
  executiveSummary: string;
  keyRisks: string[];
  recommendedActions: string[];
  citedIncidentIds: string[];
  model: string;
  promptVersion: string;
};

export type TriageRequest = {
  description: string;
  ward?: string;
  projectId?: string;
  preferredLanguage?: string;
};

export type SentimentRequest = {
  text: string;
  geographicArea?: string;
  linkedIncidentId?: string;
  sourceType?: SentimentSuggestion["sourceType"];
};

export type DraftResponseRequest = {
  incidentId: string;
  description: string;
  audience: "community" | "client" | "internal";
  language?: string;
};

export type ReportBriefRequest = {
  projectId?: string;
  incidentIds?: string[];
  audience: "board" | "regulator" | "internal";
  /** Optional free-text source (minutes, social intel, pasted report). */
  sourceText?: string;
  sourceLabel?: string;
};

export type SuggestedStakeholder = {
  name: string;
  kind: string;
  organisation?: string;
  influence: "high" | "medium" | "low" | "unknown";
  rationale: string;
};

export type StakeholderExtractSuggestion = {
  stakeholders: SuggestedStakeholder[];
  briefTitle: string;
  briefSummary: string;
  confidence: number;
  model: string;
  promptVersion: string;
};

export type StakeholderExtractRequest = {
  text: string;
  source: "minutes" | "attendance" | "social_intel" | "pasted_report";
  projectName?: string;
};

export type ActivityReportComposeRequest = {
  kind: string;
  kindLabel: string;
  audience: string;
  audienceLabel: string;
  periodLabel: string;
  authorTierLabel: string;
  authorName: string;
  projectName?: string;
  /** Selected topic / section ids (preferred for structured compose). */
  includedSectionIds?: string[];
  includedSectionLabels: string[];
  lockedSectionLabels: string[];
  factsBlock: string;
  /** Structured facts JSON for richer mock / future Cloud prompts. */
  factsJson?: string;
  tonePreference?: "plain" | "formal" | "board";
};

export type ActivityReportComposeSuggestion = {
  title: string;
  bodyMarkdown: string;
  executiveHighlight: string;
  confidence: number;
  model: string;
  promptVersion: string;
};

