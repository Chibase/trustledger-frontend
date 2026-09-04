/**
 * TE-4 trust intelligence — drafts and local advisory wording.
 * Heuristics only. No LLM provider call. Suggestion → human apply.
 */

import { recommendTrustActions, collectTrustAlerts } from "@/lib/trust/recommendations";
import { summarizeCommunityContextForIntel } from "@/lib/trust/communityContext";
import { summarizeParticipationQualityForIntel } from "@/lib/trust/participationQuality";
import { summarizeClaimVerificationForIntel } from "@/lib/trust/claimVerification";
import { summarizeTrustCausalityForIntel } from "@/lib/trust/causality";
import { buildTrustProofFromSrm, composeTrustProofReport } from "@/lib/trust/proofReport";
import type {
  BuildTrustProofExtra,
  ComposeTrustProofInput,
  TrustProofReport,
} from "@/lib/trust/proofReport";
import type { DeriveTrustLayerInput } from "@/lib/trust/derive";
import type { Incident } from "@/types/incident";
import type { TrustAlert, TrustRecommendation } from "@/lib/trust/rules";
import type {
  TrustCommunityContext,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export type TrustSensitiveDrafts = {
  responseSummary: string;
  communityFacing: string;
  internalNote: string;
  source: "local_rules";
  humanApplyRequired: true;
  autonomous: false;
};

export type TrustAdvisoryLanguage = {
  conditionSummary: string;
  reportLanguage: string;
  supportNotes: string[];
  model: "local-rules";
  promptVersion: "te-4-local-advisory-v1";
  source: "local_advisory";
  humanApplyRequired: true;
  autonomous: false;
};

export type TrustIntelligenceBrief = {
  generatedAt: string;
  alerts: TrustAlert[];
  recommendations: TrustRecommendation[];
  drafts: TrustSensitiveDrafts;
  advisory: TrustAdvisoryLanguage;
  markdown: string;
  proofMovement: TrustProofReport["overallMovement"];
};

const ADVISORY_BANNER =
  "Suggestion only — a person must apply or copy this. It is not sent, saved to a case, or used to change Trust pulse.";

function recLine(row: TrustRecommendation): string {
  return `${row.trace.ruleId}: ${row.action}`;
}

function attachGlobalSouthContextHints(
  brief: TrustIntelligenceBrief,
  input: {
    community?: TrustCommunityContext[];
    participation?: TrustParticipationRecord[];
  },
): TrustIntelligenceBrief {
  const hints = [
    ...summarizeCommunityContextForIntel(input.community || []),
    ...summarizeParticipationQualityForIntel(input.participation || []),
  ];
  if (!hints.length) return brief;
  brief.advisory.supportNotes = [...brief.advisory.supportNotes, ...hints];
  brief.markdown = renderIntelligenceMarkdown(brief);
  return brief;
}

export function draftTrustSensitiveNotes(input: {
  proof: TrustProofReport;
  recommendations: TrustRecommendation[];
  alerts: TrustAlert[];
}): TrustSensitiveDrafts {
  const { proof, recommendations, alerts } = input;
  const top = recommendations[0];
  const evidence = [
    ...new Set(recommendations.flatMap((row) => row.trace.evidenceIds)),
  ];
  const incidents = [
    ...new Set(recommendations.flatMap((row) => row.trace.incidentIds)),
  ];
  const responseSummary =
    `${proof.overallMovement.replaceAll("_", " ")} trust reading from ${proof.history.length} observation(s). ` +
    (alerts.length
      ? `${alerts.length} alert(s). `
      : "No trust alerts under current rules. ") +
    (top
      ? `Leading suggestion (${top.trace.ruleId}): ${top.action}`
      : "No action suggestions under current rules.");

  const communityFacing = [
    "Thank you for raising this with the desk.",
    `We are reading trust as ${proof.overallMovement.replaceAll("_", " ")} from recorded signals — not from an automated decision.`,
    top
      ? `Suggested next step for the team to consider: ${top.action}`
      : "No extra step is suggested from the current trust rules.",
    "This wording is a draft. It is not sent until a person reviews and applies it. We will not promise a closure date from this note.",
  ].join(" ");

  const internalNote = [
    `Trust movement: ${proof.overallMovement}.`,
    `Alerts: ${alerts.length ? alerts.map((row) => row.title).join("; ") : "none"}.`,
    `Recommendations: ${recommendations.length ? recommendations.map(recLine).join(" | ") : "none"}.`,
    evidence.length ? `Evidence ids: ${evidence.join(", ")}.` : "Evidence ids: none linked.",
    incidents.length
      ? `Linked open cases (read-only): ${incidents.join(", ")}.`
      : "Linked open cases: none.",
    "Do not auto-escalate or overwrite the existing case path.",
  ].join(" ");

  return {
    responseSummary,
    communityFacing,
    internalNote,
    source: "local_rules",
    humanApplyRequired: true,
    autonomous: false,
  };
}

/**
 * Local advisory rewrite for clarity. Does not add actions the rules did not produce.
 * Never calls Cloud / Grok (those paths return month-end templates).
 */
export function composeTrustAdvisoryLanguage(input: {
  proof: TrustProofReport;
  recommendations: TrustRecommendation[];
  alerts: TrustAlert[];
  drafts: TrustSensitiveDrafts;
}): TrustAdvisoryLanguage {
  const { proof, recommendations, alerts, drafts } = input;
  const ruleIds = [...new Set(recommendations.map((row) => row.trace.ruleId))];
  const evidence = [
    ...new Set(recommendations.flatMap((row) => row.trace.evidenceIds)),
  ];
  const conditionSummary = drafts.responseSummary;
  const reportLanguage = [
    `Trust condition (optional intelligence, not a report pack): ${proof.overallMovement.replaceAll("_", " ")}.`,
    proof.narrative,
    alerts.length
      ? `Alerts: ${alerts.map((row) => row.kind.replaceAll("_", " ")).join(", ")}.`
      : "No trust alerts.",
    ruleIds.length
      ? `Rules cited: ${ruleIds.join(", ")}.`
      : "No recommendation rules fired.",
    evidence.length
      ? `Evidence cited: ${evidence.join(", ")}.`
      : "No evidence ids were attached to the suggestions.",
    ADVISORY_BANNER,
  ].join(" ");

  const supportNotes = [
    ADVISORY_BANNER,
    ...recommendations.slice(0, 6).map(
      (row) =>
        `${row.trace.ruleId} (${row.kind.replaceAll("_", " ")}): ${row.action} — ${row.trace.ruleSummary}`,
    ),
  ];
  if (supportNotes.length === 1) {
    supportNotes.push(
      "No action suggestions fired. Existing SRM workflows and packs stay in force.",
    );
  }

  return {
    conditionSummary,
    reportLanguage,
    supportNotes,
    model: "local-rules",
    promptVersion: "te-4-local-advisory-v1",
    source: "local_advisory",
    humanApplyRequired: true,
    autonomous: false,
  };
}

function renderIntelligenceMarkdown(brief: TrustIntelligenceBrief): string {
  const recs = brief.recommendations.length
    ? brief.recommendations
        .map((row) => {
          const t = row.trace;
          return (
            `### ${row.title}\n` +
            `- Kind: ${row.kind.replaceAll("_", " ")}\n` +
            `- Action: ${row.action}\n` +
            `- Why: ${row.rationale}\n` +
            `- Rule: ${t.ruleId} — ${t.ruleSummary}\n` +
            `- Evidence: ${t.evidenceIds.join(", ") || "none linked"}\n` +
            `- Observations: ${t.observationIds.join(", ") || "none"}\n` +
            `- Cases (read-only): ${t.incidentIds.join(", ") || "none"}\n` +
            `- Decision: suggestion only; human apply required`
          );
        })
        .join("\n\n")
    : "_No recommendations under the current rules._";
  const alerts = brief.alerts.length
    ? brief.alerts
        .map(
          (row) =>
            `- **${row.title}** (${row.kind.replaceAll("_", " ")} / ${row.severity}): ${row.detail} — ${row.trace.ruleId}`,
        )
        .join("\n")
    : "- None under the current rules.";
  return [
    "# Trust intelligence (optional)",
    "",
    `Generated: ${brief.generatedAt}`,
    "",
    ADVISORY_BANNER,
    "",
    "This is **not** a monthly, executive, or board pack. It does not change Trust pulse.",
    "",
    "## Alerts",
    "",
    alerts,
    "",
    "## Recommendations",
    "",
    recs,
    "",
    "## Response support (drafts)",
    "",
    "### Summary",
    "",
    brief.drafts.responseSummary,
    "",
    "### Community-facing (not sent)",
    "",
    brief.drafts.communityFacing,
    "",
    "### Internal note (not saved)",
    "",
    brief.drafts.internalNote,
    "",
    "## Advisory wording (local rules, not a remote model)",
    "",
    brief.advisory.reportLanguage,
    "",
    ...brief.advisory.supportNotes.map((line) => `- ${line}`),
    "",
    `Model: ${brief.advisory.model} · Prompt: ${brief.advisory.promptVersion}`,
    "",
  ].join("\n");
}

export type ComposeTrustIntelligenceInput = ComposeTrustProofInput & {
  incidents?: Incident[];
  generatedAt?: string;
};

export function composeTrustIntelligenceFromProof(
  proof: TrustProofReport,
  incidents?: Incident[],
): TrustIntelligenceBrief {
  const alerts = collectTrustAlerts({ proof, incidents });
  const recommendations = recommendTrustActions({ proof, incidents });
  const drafts = draftTrustSensitiveNotes({ proof, recommendations, alerts });
  const advisory = composeTrustAdvisoryLanguage({
    proof,
    recommendations,
    alerts,
    drafts,
  });
  const brief: TrustIntelligenceBrief = {
    generatedAt: proof.generatedAt,
    alerts,
    recommendations,
    drafts,
    advisory,
    markdown: "",
    proofMovement: proof.overallMovement,
  };
  const verificationHints = summarizeClaimVerificationForIntel(proof.claims);
  const causalityHints = summarizeTrustCausalityForIntel(proof.causality);
  if (verificationHints.length || causalityHints.length) {
    brief.advisory.supportNotes = [
      ...brief.advisory.supportNotes,
      ...verificationHints,
      ...causalityHints,
    ];
  }
  brief.markdown = renderIntelligenceMarkdown(brief);
  return brief;
}

export function composeTrustIntelligence(
  input: ComposeTrustIntelligenceInput,
): TrustIntelligenceBrief {
  const proof = composeTrustProofReport(input);
  let brief = composeTrustIntelligenceFromProof(proof, input.incidents);
  brief = attachGlobalSouthContextHints(brief, {
    community: input.community,
    participation: input.participation,
  });
  if (input.generatedAt) {
    brief.generatedAt = input.generatedAt;
    brief.markdown = renderIntelligenceMarkdown(brief);
  }
  return brief;
}

/** Derive from SRM (read-only) then recommend. Does not persist or mutate cases. */
export function buildTrustIntelligenceFromSrm(
  input: DeriveTrustLayerInput & { incidents?: Incident[] },
  extra: BuildTrustProofExtra = {},
): TrustIntelligenceBrief {
  const proof = buildTrustProofFromSrm(input, extra);
  let brief = composeTrustIntelligenceFromProof(proof, input.incidents);
  brief = attachGlobalSouthContextHints(brief, {
    community: extra.storedCommunity,
    participation: extra.storedParticipation,
  });
  if (extra.generatedAt) {
    brief.generatedAt = extra.generatedAt;
    brief.markdown = renderIntelligenceMarkdown(brief);
  }
  return brief;
}
