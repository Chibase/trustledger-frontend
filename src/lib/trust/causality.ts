/**
 * TE-12 trust-movement companion reading.
 * Later-half observations that co-occur with movement are companions,
 * not causes. This is not statistical causality and not Trust pulse.
 * Attendance, mixed motive, SRM sentiment, and verification stamps
 * never become causes.
 */

import type { TrustPeriodComparison } from "@/lib/trust/analytics";
import { chronologicalScoredWeights, type TrustMovement } from "@/lib/trust/scoring";
import { TRUST_DIMENSION_LABELS } from "@/types/trustLayer";
import type {
  TrustDimensionId,
  TrustObservation,
  TrustParticipationRecord,
  TrustSignalKind,
  TrustTrend,
} from "@/types/trustLayer";

export const TRUST_CAUSALITY_STATUSES = [
  "insufficient",
  "unattributed",
  "accompanied",
] as const;

export type TrustCausalityStatus = (typeof TRUST_CAUSALITY_STATUSES)[number];

export const TRUST_CAUSALITY_STATUS_LABELS: Record<
  TrustCausalityStatus,
  string
> = {
  insufficient: "Insufficient period",
  unattributed: "Unattributed",
  accompanied: "Accompanied",
};

export const TRUST_CAUSALITY_COMPANION_KINDS = [
  "later_negative",
  "later_positive",
  "later_neutral",
  "declining_dimension",
  "improving_dimension",
  "low_willingness",
] as const;

export type TrustCausalityCompanionKind =
  (typeof TRUST_CAUSALITY_COMPANION_KINDS)[number];

export const TRUST_CAUSALITY_COMPANION_LABELS: Record<
  TrustCausalityCompanionKind,
  string
> = {
  later_negative: "Later negative observations",
  later_positive: "Later positive observations",
  later_neutral: "Later neutral observations",
  declining_dimension: "Declining dimension",
  improving_dimension: "Improving dimension",
  low_willingness: "Explicit low willingness",
};

export type TrustCausalityCompanion = {
  kind: TrustCausalityCompanionKind;
  label: string;
  count: number;
  dimension?: TrustDimensionId;
  observationIds: string[];
  participationIds: string[];
  evidenceIds: string[];
  notes: string[];
};

export type TrustCausalityReading = {
  movement: TrustMovement;
  status: TrustCausalityStatus;
  causalProof: false;
  statisticalCausality: false;
  trustPulseUsed: false;
  attendanceUsedAsCause: false;
  mixedTreatedAsWeak: false;
  sentimentUsed: false;
  companions: TrustCausalityCompanion[];
  notes: string[];
};

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function uniqueNotes(notes: string[]): string[] {
  return [...new Set(notes.filter((line) => line.length > 0))];
}

function evidenceFrom(rows: TrustObservation[]): string[] {
  return uniqueIds(rows.flatMap((row) => row.evidenceIds || []));
}

/**
 * Same later half as default `compareTrustPeriods` (chronological mid of
 * scored rows). Membership is by observation id, not `observedAt >= splitAt`,
 * so tied timestamps cannot leak earlier-half rows into companions.
 * Returned rows stay in chronological scored order.
 */
export function laterHalfObservations(
  observations: TrustObservation[],
): TrustObservation[] {
  const scored = chronologicalScoredWeights(observations);
  if (!scored.length) return [];
  const mid = Math.floor(scored.length / 2);
  const byId = new Map(observations.map((row) => [row.id, row]));
  return scored
    .slice(mid)
    .map((row) => byId.get(row.id))
    .filter((row): row is TrustObservation => Boolean(row));
}

function companionForSignal(
  kind: Extract<
    TrustCausalityCompanionKind,
    "later_negative" | "later_positive" | "later_neutral"
  >,
  signal: TrustSignalKind,
  later: TrustObservation[],
): TrustCausalityCompanion | null {
  const rows = later.filter((row) => row.signal === signal);
  if (!rows.length) return null;
  return {
    kind,
    label: TRUST_CAUSALITY_COMPANION_LABELS[kind],
    count: rows.length,
    observationIds: uniqueIds(rows.map((row) => row.id)),
    participationIds: [],
    evidenceIds: evidenceFrom(rows),
    notes: [
      "Later-half scored observations co-occur with the period. They are not causes.",
    ],
  };
}

function dimensionCompanion(
  kind: Extract<
    TrustCausalityCompanionKind,
    "declining_dimension" | "improving_dimension"
  >,
  claim: {
    dimension: TrustDimensionId;
    observationIds: string[];
    evidenceIds: string[];
  },
): TrustCausalityCompanion {
  const trend = kind === "declining_dimension" ? "declining" : "improving";
  return {
    kind,
    label: `${TRUST_DIMENSION_LABELS[claim.dimension]} ${trend}`,
    count: 1,
    dimension: claim.dimension,
    observationIds: uniqueIds(claim.observationIds),
    participationIds: [],
    evidenceIds: uniqueIds(claim.evidenceIds),
    notes: [
      `Dimension trend is ${trend} under the ±0.34 later-vs-earlier rule. That trend is not a proven cause.`,
    ],
  };
}

export function formatCausalityMix(reading: TrustCausalityReading): string {
  if (reading.status === "insufficient") return "insufficient period";
  if (reading.status === "unattributed") return "unattributed · not causal proof";
  return `accompanied ${reading.companions.length} · not causal proof`;
}

export function summarizeTrustCausality(input: {
  observations: TrustObservation[];
  period: Pick<
    TrustPeriodComparison,
    "splitAt" | "movement" | "earlier" | "later"
  >;
  claims?: Array<{
    dimension: TrustDimensionId;
    trend: TrustTrend;
    observationIds: string[];
    evidenceIds: string[];
  }>;
  participation?: TrustParticipationRecord[];
  overallMovement?: TrustMovement;
}): TrustCausalityReading {
  const movement = input.overallMovement || input.period.movement;
  const notes: string[] = [
    "Later-half companions co-occur with trust movement. They are not causes. This is not statistical causality and not Trust pulse.",
  ];
  const companions: TrustCausalityCompanion[] = [];

  if (input.period.movement === "insufficient") {
    notes.push("Need scored observations on both halves of the period before companions can be listed.");
    return {
      movement,
      status: "insufficient",
      causalProof: false,
      statisticalCausality: false,
      trustPulseUsed: false,
      attendanceUsedAsCause: false,
      mixedTreatedAsWeak: false,
      sentimentUsed: false,
      companions: [],
      notes: uniqueNotes(notes),
    };
  }

  const later = laterHalfObservations(input.observations);
  const laterNegative = companionForSignal("later_negative", "negative", later);
  const laterPositive = companionForSignal("later_positive", "positive", later);
  const laterNeutral = companionForSignal("later_neutral", "neutral", later);
  if (laterNegative) companions.push(laterNegative);
  if (laterPositive) companions.push(laterPositive);
  if (laterNeutral) companions.push(laterNeutral);

  for (const claim of input.claims || []) {
    if (claim.trend === "declining") {
      companions.push(dimensionCompanion("declining_dimension", claim));
    } else if (claim.trend === "improving") {
      companions.push(dimensionCompanion("improving_dimension", claim));
    }
  }

  const participation = input.participation || [];
  const lowWillingness = participation.filter(
    (row) =>
      row.willingnessToParticipate === "low" ||
      row.willingnessToContribute === "low",
  );
  if (lowWillingness.length) {
    companions.push({
      kind: "low_willingness",
      label: TRUST_CAUSALITY_COMPANION_LABELS.low_willingness,
      count: lowWillingness.length,
      observationIds: [],
      participationIds: uniqueIds(lowWillingness.map((row) => row.id)),
      evidenceIds: [],
      notes: [
        "Explicit low willingness is listed as a companion. Mixed motive and attendance are not.",
      ],
    });
  }

  const mixedRows = participation.filter((row) => row.motivation === "mixed");
  if (mixedRows.length) {
    notes.push(
      "Mixed motive is not treated as a cause and is not treated as weak participation.",
    );
  }
  const presenceRows = participation.filter(
    (row) =>
      row.presenceMode === "in_person" ||
      row.presenceMode === "proxy" ||
      row.presenceMode === "household_rep" ||
      row.attendanceDoesNotEqualConsent === true,
  );
  if (presenceRows.length) {
    notes.push("Attendance or presence is not treated as a cause of trust movement.");
  }

  const status: TrustCausalityStatus = companions.length
    ? "accompanied"
    : "unattributed";

  return {
    movement,
    status,
    causalProof: false,
    statisticalCausality: false,
    trustPulseUsed: false,
    attendanceUsedAsCause: false,
    mixedTreatedAsWeak: false,
    sentimentUsed: false,
    companions,
    notes: uniqueNotes(notes),
  };
}

export function summarizeTrustCausalityForIntel(
  reading: TrustCausalityReading,
): string[] {
  if (reading.status === "insufficient") return [];
  return uniqueNotes([
    `Trust-movement companions: ${formatCausalityMix(reading)}. Later-half signals co-occur; they are not causes. This is not statistical causality and not Trust pulse.`,
    ...reading.notes.filter(
      (line) => !line.startsWith("Later-half companions co-occur"),
    ),
  ]);
}
