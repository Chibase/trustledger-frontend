/**
 * Evidence-backed trust proof summaries.
 * Deterministic — no LLM. Does not replace monthly / executive / board packs.
 */

import {
  analyzeTrust,
  analyticsRuleSummary,
  describeTrustMovement,
  formatTrustMean,
  mergeObservationsById,
  type TrustAnalyticsSlice,
  type TrustComparisonAxis,
  type TrustMovement,
  type TrustPeriodComparison,
  type TrustRiskFlag,
} from "@/lib/trust/analytics";
import { deriveTrustLayer, type DeriveTrustLayerInput } from "@/lib/trust/derive";
import { TRUST_DIMENSION_LABELS } from "@/types/trustLayer";
import type { Stakeholder } from "@/types/stakeholder";
import type {
  TrustCommunityContext,
  TrustDimensionId,
  TrustDimensionStatus,
  TrustLevel,
  TrustObservation,
  TrustObservationSource,
  TrustParticipationRecord,
  TrustSignalKind,
  TrustTrend,
} from "@/types/trustLayer";

export type TrustProofClaim = {
  dimension: TrustDimensionId;
  claim: string;
  level: TrustLevel;
  trend: TrustTrend;
  sampleSize: number;
  evidenceIds: string[];
  observationIds: string[];
  supportingSignals: string[];
};

export type TrustHistoryEntry = {
  at: string;
  observationId: string;
  dimension: TrustDimensionId;
  signal: TrustSignalKind;
  source: TrustObservationSource;
  sourceId?: string;
  evidenceIds: string[];
  summary: string;
};

export type TrustParticipationSummary = {
  total: number;
  participateHigh: number;
  participateLow: number;
  participateMedium: number;
  contributeHigh: number;
  contributeLow: number;
  trustDriven: number;
  notTrustDriven: number;
  notes: string[];
};

export type TrustProofSources = {
  srmModules: string[];
  overlayUsed: boolean;
  layerUsed: boolean;
  trustPulseUsed: false;
};

export type TrustProofReport = {
  generatedAt: string;
  overallMovement: TrustMovement;
  narrative: string;
  claims: TrustProofClaim[];
  history: TrustHistoryEntry[];
  participation: TrustParticipationSummary;
  risks: TrustRiskFlag[];
  comparisons: Record<TrustComparisonAxis, TrustAnalyticsSlice[]>;
  period: TrustPeriodComparison;
  statuses: TrustDimensionStatus[];
  markdown: string;
  sources: TrustProofSources;
};

const HISTORY_CAP = 24;

function unique(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function summarizeParticipation(
  rows: TrustParticipationRecord[],
): TrustParticipationSummary {
  const notes = unique(
    rows.map((row) => row.note || "").filter((note) => note.length > 0),
  );
  return {
    total: rows.length,
    participateHigh: rows.filter((row) => row.willingnessToParticipate === "high")
      .length,
    participateLow: rows.filter((row) => row.willingnessToParticipate === "low")
      .length,
    participateMedium: rows.filter(
      (row) => row.willingnessToParticipate === "medium",
    ).length,
    contributeHigh: rows.filter((row) => row.willingnessToContribute === "high")
      .length,
    contributeLow: rows.filter((row) => row.willingnessToContribute === "low")
      .length,
    trustDriven: rows.filter((row) => row.trustDriven === true).length,
    notTrustDriven: rows.filter((row) => row.trustDriven === false).length,
    notes,
  };
}

function claimForDimension(
  status: TrustDimensionStatus,
  observations: TrustObservation[],
): TrustProofClaim {
  const rows = observations.filter((row) => row.dimension === status.dimension);
  const supportingSignals = rows
    .filter((row) => row.signal !== "unknown")
    .slice()
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt))
    .slice(0, 6)
    .map((row) => {
      const evidence =
        row.evidenceIds.length > 0
          ? `; evidence ${row.evidenceIds.join(", ")}`
          : "";
      const note = row.note ? ` — ${row.note}` : "";
      return `${row.observedAt.slice(0, 10)} ${row.signal} from ${row.source} (${row.id})${evidence}${note}`;
    });
  const evidenceIds = unique(rows.flatMap((row) => row.evidenceIds));
  const claim = `${TRUST_DIMENSION_LABELS[status.dimension]} is ${status.level.replaceAll("_", " ")} (${status.trend}) from ${status.sampleSize} scored signal(s).`;
  return {
    dimension: status.dimension,
    claim,
    level: status.level,
    trend: status.trend,
    sampleSize: status.sampleSize,
    evidenceIds,
    observationIds: rows.map((row) => row.id),
    supportingSignals,
  };
}

function historyFromObservations(
  observations: TrustObservation[],
): TrustHistoryEntry[] {
  return observations
    .slice()
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((row) => ({
      at: row.observedAt,
      observationId: row.id,
      dimension: row.dimension,
      signal: row.signal,
      source: row.source,
      sourceId: row.sourceId,
      evidenceIds: row.evidenceIds,
      summary: `${TRUST_DIMENSION_LABELS[row.dimension]} ${row.signal} via ${row.source}${row.sourceId ? ` ${row.sourceId}` : ""}${row.note ? ` — ${row.note}` : ""}`,
    }));
}

function whyNarrative(
  movement: TrustMovement,
  period: TrustPeriodComparison,
  claims: TrustProofClaim[],
  risks: TrustRiskFlag[],
): string {
  const changing = claims.filter(
    (row) => row.trend === "improving" || row.trend === "declining",
  );
  const changeBit = changing.length
    ? changing
        .map((row) => `${TRUST_DIMENSION_LABELS[row.dimension]} is ${row.trend}`)
        .join("; ")
    : "no dimension crossed the ±0.34 trend threshold";
  const riskBit = risks.length
    ? ` ${risks.length} risk flag(s) were raised from the same rules.`
    : " No risk flags were raised.";
  const laterSupport = claims
    .flatMap((row) => row.supportingSignals)
    .slice(0, 4);
  const supportBit = laterSupport.length
    ? ` Signals cited: ${laterSupport.join(" | ")}.`
    : "";
  return (
    `${describeTrustMovement(movement)} ` +
    `Earlier mean ${formatTrustMean(period.earlier.mean)} (n=${period.earlier.count}) ` +
    `vs later mean ${formatTrustMean(period.later.mean)} (n=${period.later.count}); ` +
    `delta ${formatTrustMean(period.delta)}. ` +
    `Dimension movement: ${changeBit}.` +
    `${riskBit}${supportBit}`
  );
}

function inferSources(
  observations: TrustObservation[],
  participation: TrustParticipationRecord[],
): TrustProofSources {
  const modules = unique([
    ...observations.map((row) => row.source),
    ...participation.map((row) => row.source),
  ]);
  const overlayUsed = observations.some(
    (row) =>
      (row.note || "").includes("trustResponse") ||
      (row.note || "").includes("trustSupport"),
  );
  return {
    srmModules: modules,
    overlayUsed,
    layerUsed: observations.length > 0 || participation.length > 0,
    trustPulseUsed: false,
  };
}

function renderSliceTable(slices: TrustAnalyticsSlice[]): string {
  if (!slices.length) return "_None._";
  return slices
    .map(
      (slice) =>
        `- **${slice.label}** — ${slice.movement}; level ${slice.level.replaceAll("_", " ")}; ` +
        `mean ${formatTrustMean(slice.meanSignal)} from ${slice.scoredCount} scored of ${slice.observationCount}` +
        (slice.evidenceIds.length
          ? `; evidence ${slice.evidenceIds.join(", ")}`
          : "; no evidence ids"),
    )
    .join("\n");
}

function renderMarkdown(report: {
  generatedAt: string;
  overallMovement: TrustMovement;
  narrative: string;
  claims: TrustProofClaim[];
  history: TrustHistoryEntry[];
  participation: TrustParticipationSummary;
  risks: TrustRiskFlag[];
  comparisons: Record<TrustComparisonAxis, TrustAnalyticsSlice[]>;
  period: TrustPeriodComparison;
  sources: TrustProofSources;
}): string {
  const history = report.history.slice(0, HISTORY_CAP);
  const omitted =
    report.history.length > HISTORY_CAP
      ? `\n- _${report.history.length - HISTORY_CAP} earlier or additional observations omitted from this list._`
      : "";
  const claims = report.claims
    .map((claim) => {
      const evidence = claim.evidenceIds.length
        ? claim.evidenceIds.join(", ")
        : "none linked";
      const signals = claim.supportingSignals.length
        ? claim.supportingSignals.map((line) => `  - ${line}`).join("\n")
        : "  - none scored";
      return (
        `### ${TRUST_DIMENSION_LABELS[claim.dimension]}\n` +
        `${claim.claim}\n` +
        `Evidence: ${evidence}\n` +
        `Supporting signals:\n${signals}`
      );
    })
    .join("\n\n");
  const risks = report.risks.length
    ? report.risks
        .map(
          (flag) =>
            `- **${flag.title}** (${flag.severity} / ${flag.kind.replaceAll("_", " ")}): ${flag.detail}`,
        )
        .join("\n")
    : "- None under the current rules.";
  const historyLines = history.length
    ? history
        .map(
          (row) =>
            `- ${row.at.slice(0, 10)} — ${row.summary}` +
            (row.evidenceIds.length
              ? ` [${row.evidenceIds.join(", ")}]`
              : ""),
        )
        .join("\n") + omitted
    : "- No trust observations yet.";
  const part = report.participation;
  return [
    "# Trust proof summary",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "This summary is **optional**. It does not replace monthly, executive, or board packs, and it does not change the incident Trust pulse.",
    "",
    "## Overall movement",
    "",
    `**${report.overallMovement.replaceAll("_", " ")}**`,
    "",
    report.narrative,
    "",
    "## Why this conclusion",
    "",
    analyticsRuleSummary(),
    "",
    `Period split at ${report.period.splitAt || "median observation time"} — ${report.period.rule}`,
    "",
    "## Claims by dimension",
    "",
    claims || "_No dimension has observations._",
    "",
    "## Trust history",
    "",
    historyLines,
    "",
    "## Participation and willingness",
    "",
    `- Records: ${part.total}`,
    `- Willingness to participate: high ${part.participateHigh}, medium ${part.participateMedium}, low ${part.participateLow}`,
    `- Willingness to contribute: high ${part.contributeHigh}, low ${part.contributeLow}`,
    `- Looks trust-driven: ${part.trustDriven}; not trust-driven: ${part.notTrustDriven}`,
    part.notes.length ? `- Notes: ${part.notes.join("; ")}` : "- Notes: none",
    "",
    "## Comparison — community",
    "",
    renderSliceTable(report.comparisons.community),
    "",
    "## Comparison — location",
    "",
    renderSliceTable(report.comparisons.location),
    "",
    "## Comparison — stakeholder group",
    "",
    renderSliceTable(report.comparisons.stakeholder_group),
    "",
    "## Comparison — project phase (source proxy)",
    "",
    "Phase is inferred from the observation source (case → resolution, engagement → engagement, commitment → delivery, evidence → assurance). It is not a project status field.",
    "",
    renderSliceTable(report.comparisons.project_phase),
    "",
    "## Risk flags",
    "",
    risks,
    "",
    "## Sources",
    "",
    `- SRM / layer sources: ${report.sources.srmModules.join(", ") || "none"}`,
    `- TE-1 overlay fields used: ${report.sources.overlayUsed ? "yes" : "no"}`,
    `- Trust layer rows used: ${report.sources.layerUsed ? "yes" : "no"}`,
    "- Incident Trust pulse used: no",
    "",
    "## How to read this",
    "",
    analyticsRuleSummary(),
    "",
  ].join("\n");
}

export type ComposeTrustProofInput = {
  observations: TrustObservation[];
  participation?: TrustParticipationRecord[];
  community?: TrustCommunityContext[];
  stakeholders?: Pick<Stakeholder, "id" | "kind">[];
  generatedAt?: string;
};

export function composeTrustProofReport(
  input: ComposeTrustProofInput,
): TrustProofReport {
  const observations = mergeObservationsById(input.observations);
  const participation = input.participation || [];
  const analytics = analyzeTrust(observations, {
    community: input.community,
    stakeholders: input.stakeholders,
  });
  const claims = analytics.statuses.map((status) =>
    claimForDimension(status, observations),
  );
  const history = historyFromObservations(observations);
  const participationSummary = summarizeParticipation(participation);
  const sources = inferSources(observations, participation);
  const generatedAt = input.generatedAt || new Date().toISOString();
  const narrative = whyNarrative(
    analytics.overallMovement,
    analytics.period,
    claims,
    analytics.risks,
  );
  const report: TrustProofReport = {
    generatedAt,
    overallMovement: analytics.overallMovement,
    narrative,
    claims,
    history,
    participation: participationSummary,
    risks: analytics.risks,
    comparisons: analytics.comparisons,
    period: analytics.period,
    statuses: analytics.statuses,
    markdown: "",
    sources,
  };
  report.markdown = renderMarkdown(report);
  return report;
}

export type BuildTrustProofExtra = {
  storedObservations?: TrustObservation[];
  storedParticipation?: TrustParticipationRecord[];
  storedCommunity?: TrustCommunityContext[];
  generatedAt?: string;
};

/** Derive from SRM (read-only) then compose proof. Does not persist. */
export function buildTrustProofFromSrm(
  input: DeriveTrustLayerInput,
  extra: BuildTrustProofExtra = {},
): TrustProofReport {
  const derived = deriveTrustLayer(input);
  return composeTrustProofReport({
    observations: mergeObservationsById(
      extra.storedObservations || [],
      derived.observations,
    ),
    participation: [
      ...(extra.storedParticipation || []),
      ...derived.participation,
    ],
    community: [...(extra.storedCommunity || []), ...derived.community],
    stakeholders: input.stakeholders,
    generatedAt: extra.generatedAt,
  });
}
