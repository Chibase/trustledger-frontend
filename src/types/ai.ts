/**
 * Contracts for continuous AI features.
 * Backend target: srm-core whitelisted methods (Grok via xAI API).
 * Frontend never calls the LLM provider directly.
 */

export type AiSuggestionStatus = "idle" | "loading" | "ready" | "error";

export type IncidentTriageSuggestion = {
  summary: string;
  category: string;
  geographicAreaHint: string;
  suggestedPriority: "P4-Low" | "P3-Medium" | "P2-High" | "P1-Critical";
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
};
