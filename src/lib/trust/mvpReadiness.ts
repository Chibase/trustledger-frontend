/**
 * TE-6 MVP packaging — compose existing TE-1…TE-5 outputs.
 * Not a new trust model. Does not persist, escalate, or call a remote model.
 */

import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import {
  mergeObservationsById,
  mergeTrustRowsById,
} from "@/lib/trust/analytics";
import { listAuthorityRoles } from "@/lib/trust/authority";
import { summarizeCommunityContextForIntel } from "@/lib/trust/communityContext";
import { deriveTrustLayer, type DeriveTrustLayerInput } from "@/lib/trust/derive";
import {
  composeTrustIntelligence,
  type TrustIntelligenceBrief,
} from "@/lib/trust/intelligence";
import { summarizeParticipationRealismForIntel } from "@/lib/trust/participationRealism";
import {
  buildTrustProofFromSrm,
  composeTrustProofReport,
  type BuildTrustProofExtra,
  type ComposeTrustProofInput,
  type TrustProofReport,
} from "@/lib/trust/proofReport";
import { TRUST_INTELLIGENCE_RULES } from "@/lib/trust/rules";
import type { Incident } from "@/types/incident";
import type { Stakeholder } from "@/types/stakeholder";
import type { TrustAuthorityRole } from "@/types/trustLayer";

/** What this presentation line can claim. Internal — not marketing copy. */
export const TRUST_MVP_COMPLETE = [
  "SRM desk: projects, incidents, stakeholders, engagements, commitments, evidence, reports",
  "TE-1 optional trust overlay on existing records (not posted to Cloud mappers)",
  "TE-2 parallel trust layer (six blueprint dimensions, observations, participation, community context; SRM sentiment is not a trust observation)",
  "TE-3 explainable proof: movement, claims, history, comparisons, risks",
  "TE-4 suggestion-only recommendations and alerts with published rule ids",
  "TE-5 optional Global South field/context (not a single community template)",
] as const;

export const TRUST_MVP_PARTIAL = [
  "Trust proof / recommendations UI is on-demand on /app/reports, not a monthly pack",
  "Field extras persist to tl-trust-layer on Capture apply; they do not auto-save while typing",
  "Language structures exist; product UI is not translated",
  "Authority roles are derived from existing stakeholder kind/tags, not a new CRM kind",
  "TE-4/TE-5 ride the presentation stack; merge to master is a separate release step",
] as const;

export const TRUST_MVP_FUTURE = [
  "Cloud DocTypes / srm-core methods for the trust layer",
  "Production ledger writes (blocked on KEY_MANAGEMENT.md)",
  "Live Grok/Cloud for trust proof or recommendations",
  "Full TEDS / ESIP blueprint completeness",
  "National geo packs beyond the ZA baseline (ADR-040 / ADR-045)",
  "Product-wide i18n and community-checked translation workflow",
  "Auto-saving field extras into tl-trust-layer without human apply",
] as const;

export const TRUST_MVP_DO_NOT_PROMISE = [
  "autonomous apply, auto-send, or auto-escalation",
  "ledger-backed or cryptographically sealed trust claims in production",
  "full TEDS MVP or Version 003 GIS / public portal",
  "that every community behaves the same way",
  "that attendance equals consent or that high influence is informal influence",
  "that working language is English",
  "remote-model trust reports (Cloud/Grok month-end templates are blocked on this path)",
  "demo INC-* bleed into customer/trial workspaces",
] as const;

export type TrustMvpReadinessFlags = {
  proofReport: boolean;
  evidenceBackedSummary: boolean;
  trustTrendView: boolean;
  communityContextView: boolean;
  recommendationOutput: boolean;
  recommendationsSuggestionOnly: boolean;
  autonomous: false;
  trustPulseUsed: false;
  ledgerWrites: false;
};

export type TrustMvpPackage = {
  generatedAt: string;
  proof: TrustProofReport;
  intelligence: TrustIntelligenceBrief;
  communityHints: string[];
  authorityRoles: TrustAuthorityRole[];
  ruleCatalog: string[];
  readiness: TrustMvpReadinessFlags;
  markdown: string;
};

function flagsFrom(
  proof: TrustProofReport,
  intelligence: TrustIntelligenceBrief,
  communityHints: string[],
): TrustMvpReadinessFlags {
  const evidenceBackedSummary =
    proof.claims.some((row) => row.evidenceIds.length > 0) ||
    proof.history.some((row) => row.evidenceIds.length > 0);
  const scoredBothHalves =
    proof.period.earlier.count > 0 && proof.period.later.count > 0;
  const trustTrendView =
    scoredBothHalves ||
    (proof.history.length > 0 &&
      proof.overallMovement !== "insufficient");
  const communityContextView =
    (proof.comparisons.community || []).some(
      (row) => row.id !== "unspecified_community" && row.observationCount > 0,
    ) || communityHints.length > 0;
  const recommendationsSuggestionOnly =
    intelligence.recommendations.length === 0 ||
    intelligence.recommendations.every(
      (row) =>
        row.decision === "suggestion_only" &&
        row.autonomous === false &&
        row.humanApplyRequired,
    );
  return {
    proofReport: proof.history.length > 0,
    evidenceBackedSummary,
    trustTrendView,
    communityContextView,
    recommendationOutput: intelligence.recommendations.length > 0,
    recommendationsSuggestionOnly,
    autonomous: false,
    trustPulseUsed: false,
    ledgerWrites: false,
  };
}

/** Nest ATX headings so a document can sit under an existing section. */
export function demoteMarkdownHeadings(markdown: string, levels: number): string {
  const step = Math.max(0, levels);
  if (!step) return markdown;
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      const match = /^(#{1,6})(\s+)/.exec(line);
      if (!match) return line;
      const next = Math.min(6, match[1].length + step);
      return `${"#".repeat(next)}${match[2]}${line.slice(match[0].length)}`;
    })
    .join("\n");
}

function renderMvpMarkdown(pkg: {
  generatedAt: string;
  proof: TrustProofReport;
  intelligence: TrustIntelligenceBrief;
  communityHints: string[];
  authorityRoles: TrustAuthorityRole[];
  readiness: TrustMvpReadinessFlags;
}): string {
  const hints = pkg.communityHints.length
    ? pkg.communityHints.map((line) => `- ${line}`).join("\n")
    : "- None captured on this run.";
  const roles = pkg.authorityRoles.length
    ? pkg.authorityRoles.map((role) => `- ${role}`).join("\n")
    : "- None classified from current stakeholders.";
  const ready = pkg.readiness;
  return [
    "# TrustLedger MVP package (optional, internal)",
    "",
    `Generated: ${pkg.generatedAt}`,
    "",
    "This is **not** a monthly, executive, or board pack. It does not change Trust pulse.",
    "Recommendations are suggestion only. Nothing is sent, saved, or auto-applied.",
    "Do not promise ledger writes, autonomous AI, or full TEDS completeness from this file.",
    "",
    "## Readiness",
    "",
    `- Proof report: ${ready.proofReport ? "yes" : "no"}`,
    `- Evidence-backed summary: ${ready.evidenceBackedSummary ? "yes" : "no"}`,
    `- Trust trend view: ${ready.trustTrendView ? "yes" : "no"}`,
    `- Community / context view: ${ready.communityContextView ? "yes" : "no"}`,
    `- Recommendation output: ${ready.recommendationOutput ? "yes" : "no"}`,
    `- Suggestion only: ${ready.recommendationsSuggestionOnly ? "yes" : "no"}`,
    `- Autonomous: no`,
    `- Trust pulse used: no`,
    `- Ledger writes: no`,
    "",
    "## Local context",
    "",
    hints,
    "",
    "## Authority roles present",
    "",
    roles,
    "",
    "## Proof",
    "",
    demoteMarkdownHeadings(pkg.proof.markdown, 2),
    "",
    "## Intelligence",
    "",
    demoteMarkdownHeadings(pkg.intelligence.markdown, 2),
    "",
  ].join("\n");
}

export function composeTrustMvpPackage(
  input: ComposeTrustProofInput & { incidents?: Incident[]; stakeholders?: Stakeholder[] },
): TrustMvpPackage {
  const proof = composeTrustProofReport(input);
  const intelligence = composeTrustIntelligence({
    ...input,
    generatedAt: input.generatedAt || proof.generatedAt,
  });
  const communityHints = [
    ...summarizeCommunityContextForIntel(input.community || []),
    ...summarizeParticipationRealismForIntel(input.participation || []),
  ];
  const authorityRoles = listAuthorityRoles(input.stakeholders || []);
  const generatedAt = input.generatedAt || proof.generatedAt;
  const readiness = flagsFrom(proof, intelligence, communityHints);
  const pkg: TrustMvpPackage = {
    generatedAt,
    proof,
    intelligence,
    communityHints,
    authorityRoles,
    ruleCatalog: Object.keys(TRUST_INTELLIGENCE_RULES),
    readiness,
    markdown: "",
  };
  pkg.markdown = renderMvpMarkdown(pkg);
  return pkg;
}

/** Derive from SRM (read-only) then package. Does not persist. */
export function buildTrustMvpPackageFromSrm(
  input: DeriveTrustLayerInput & { incidents?: Incident[] },
  extra: BuildTrustProofExtra = {},
): TrustMvpPackage {
  const derived = deriveTrustLayer(input);
  return composeTrustMvpPackage({
    observations: mergeObservationsById(
      extra.storedObservations || [],
      derived.observations,
    ),
    participation: mergeTrustRowsById(
      extra.storedParticipation || [],
      derived.participation,
    ),
    community: mergeTrustRowsById(
      extra.storedCommunity || [],
      derived.community,
    ),
    stakeholders: input.stakeholders,
    incidents: input.incidents,
    generatedAt: extra.generatedAt,
  });
}

/** Same numbers as `buildTrustProofFromSrm` — packaging must not fork proof math. */
export function mvpProofMatchesStandalone(
  input: DeriveTrustLayerInput,
  extra: BuildTrustProofExtra = {},
): boolean {
  const packaged = buildTrustMvpPackageFromSrm(input, extra);
  const standalone = buildTrustProofFromSrm(input, extra);
  return (
    packaged.proof.overallMovement === standalone.overallMovement &&
    packaged.proof.narrative === standalone.narrative
  );
}

export function trustPulseUnchangedByMvpPackaging(
  incidents: Incident[],
  extra: BuildTrustProofExtra = {},
): boolean {
  const before = JSON.stringify(trustIndexFromIncidents(incidents));
  buildTrustMvpPackageFromSrm({ incidents }, extra);
  return JSON.stringify(trustIndexFromIncidents(incidents)) === before;
}
