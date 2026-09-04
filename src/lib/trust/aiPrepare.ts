import { analyzeCommunicationNote } from "@/lib/sentimentAnalysis";
import type {
  DraftResponseRequest,
  ReportBriefSuggestion,
  SentimentSuggestion,
  TriageRequest,
} from "@/types/ai";
import type {
  StakeholderTrustResponse,
  TrustDraftOverlay,
  TrustReportSummaryOverlay,
  TrustTriageOverlay,
} from "@/types/trustOverlay";
import { emptyTrustResponse } from "@/lib/trust/response";

function riskFromText(text: string): TrustTriageOverlay["socialLicenceRisk"] {
  const body = text.toLowerCase();
  if (
    /protest|toyi-?toyi|boycott|unrest|violence|threat|disgruntl/.test(body)
  ) {
    return "high";
  }
  if (
    /angry|ignored|broken promise|not consulted|distrust|no faith/.test(body)
  ) {
    return "high";
  }
  if (/delay|unhappy|complain|dust|noise|flood|sla/.test(body)) {
    return "medium";
  }
  return "low";
}

/** Heuristic overlay — not applied unless the caller opts in. */
export function prepareTrustTriageOverlay(
  input: Pick<TriageRequest, "description" | "ward">,
): TrustTriageOverlay {
  const socialLicenceRisk = riskFromText(input.description || "");
  const place = input.ward?.trim() ? ` in ${input.ward.trim()}` : "";
  const rationale =
    socialLicenceRisk === "high"
      ? `Social licence risk is elevated${place}: wording suggests unrest, exclusion, or a broken promise. Suggestion only — do not auto-escalate.`
      : socialLicenceRisk === "medium"
        ? `Social licence risk is moderate${place}: amenity or delay cues. Keep the existing triage path.`
        : `Social licence risk looks contained${place}. Existing triage stands.`;
  return { socialLicenceRisk, rationale };
}

function attitudeFromCues(
  text: string,
  high: RegExp,
  low: RegExp,
): StakeholderTrustResponse["willingnessToParticipate"] {
  if (low.test(text)) return "low";
  if (high.test(text)) return "high";
  return "unknown";
}

/**
 * Maps note text to overlay attitudes. Never writes `sentimentLabel` on the record.
 */
export function prepareTrustResponseHints(text: string): StakeholderTrustResponse {
  const analyzed = analyzeCommunicationNote(text);
  const body = text.replace(/\s+/g, " ");
  return {
    ...emptyTrustResponse(),
    trustSentiment: analyzed.label,
    willingnessToParticipate: attitudeFromCues(
      body,
      /\b(attend|take part|participate|join the meeting|we will come)\b/i,
      /\b(will not attend|boycott|walkout|stay away)\b/i,
    ),
    willingnessToContribute: attitudeFromCues(
      body,
      /\b(volunteer|local labour|local hire|contribute|in-kind)\b/i,
      /\b(will not contribute|no labour|refuse to work)\b/i,
    ),
    confidenceInProcess: attitudeFromCues(
      body,
      /\b(trust the process|due process|fair process|confident in the process)\b/i,
      /\b(no faith in the process|process is a sham|rigged process)\b/i,
    ),
    confidenceInImplementer: attitudeFromCues(
      body,
      /\b(trust (?:the |you |the contractor|the implementer)|good faith)\b/i,
      /\b(do not trust (?:you|them|the contractor|the implementer)|no faith in)\b/i,
    ),
  };
}

export function prepareTrustSensitiveDraft(
  input: Pick<DraftResponseRequest, "audience" | "description">,
): TrustDraftOverlay {
  const risk = riskFromText(input.description || "");
  const community = input.audience === "community";
  const trustSensitive = community || risk !== "low";
  const notes: string[] = [];
  if (community) {
    notes.push(
      "Community audience: keep acknowledgment, owner, and next update time — do not auto-send.",
    );
  }
  if (risk === "high") {
    notes.push(
      "High social-licence wording: avoid defensive tone; do not promise closure dates the desk cannot keep.",
    );
  }
  if (notes.length === 0) {
    notes.push("No extra trust-sensitivity flags beyond the existing draft.");
  }
  return { trustSensitive, notes };
}

export function prepareTrustReportSummary(
  brief: Pick<ReportBriefSuggestion, "citedIncidentIds" | "keyRisks">,
): TrustReportSummaryOverlay {
  const citedCaseCount = brief.citedIncidentIds.length;
  const headline =
    citedCaseCount === 0
      ? "No cited cases — overlay summary only; existing brief text is unchanged."
      : `Overlay: ${citedCaseCount} cited case(s), ${brief.keyRisks.length} risk line(s). Existing brief text is unchanged.`;
  return { citedCaseCount, headline };
}

export function attachTrustResponseHints(
  suggestion: SentimentSuggestion,
  text: string,
  include: boolean | undefined,
): SentimentSuggestion {
  if (!include) return suggestion;
  return {
    ...suggestion,
    trustResponseHints: prepareTrustResponseHints(text),
  };
}

/** Strip the TE-1 opt-in so Cloud method bodies match the pre-TE-1 contract. */
export function omitTrustOverlayFlag<T extends { includeTrustOverlay?: boolean }>(
  input: T,
): Omit<T, "includeTrustOverlay"> {
  const { includeTrustOverlay: _omit, ...payload } = input;
  void _omit;
  return payload;
}
