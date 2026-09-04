/**
 * TE-9 participation-quality reading.
 * Classifies stored participation as trust / obligation / livelihood / mixed
 * (or unknown). Mixed is not weak. Attendance is never read as consent.
 * Does not change Trust pulse or `participationLooksTrustDriven`.
 */

import {
  attendanceIsNotConsent,
  mixedMotivationDoesNotEqualTrust,
  summarizeParticipationRealismForIntel,
} from "@/lib/trust/participationRealism";
import { TRUST_PARTICIPATION_MOTIVATIONS } from "@/types/trustLayer";
import type {
  TrustParticipationMotivation,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export const TRUST_PARTICIPATION_QUALITY_CLASSES =
  TRUST_PARTICIPATION_MOTIVATIONS;

export type TrustParticipationQualityClass = TrustParticipationMotivation;

export const TRUST_PARTICIPATION_QUALITY_LABELS: Record<
  TrustParticipationQualityClass,
  string
> = {
  trust: "Trust",
  obligation: "Obligation",
  livelihood: "Livelihood",
  mixed: "Mixed",
  unknown: "Unknown",
};

export type TrustParticipationQualityReading = {
  id: string;
  qualityClass: TrustParticipationQualityClass;
  classSource: "stored_motivation" | "unspecified";
  consentImplied: false;
  attendanceDoesNotEqualConsent: true;
  treatedAsWeak: boolean;
  notes: string[];
};

export type TrustParticipationQualityIndex = {
  total: number;
  byClass: Record<TrustParticipationQualityClass, number>;
  unspecified: number;
  consentImpliedCount: 0;
  attendanceNotConsentCount: number;
  weakByWillingnessOnly: number;
  mixedIsNotWeak: true;
  attendanceIsNotConsent: true;
  notes: string[];
};

function emptyByClass(): Record<TrustParticipationQualityClass, number> {
  return {
    trust: 0,
    obligation: 0,
    livelihood: 0,
    mixed: 0,
    unknown: 0,
  };
}

function uniqueNotes(notes: string[]): string[] {
  return [...new Set(notes.filter((line) => line.length > 0))];
}

/**
 * Stored `motivation` is the class when set. High willingness, in-person
 * presence, and `trustDriven` never promote a row to trust.
 */
export function classifyParticipationQuality(
  row: TrustParticipationRecord,
): TrustParticipationQualityReading {
  const stored = row.motivation;
  const hasStored =
    stored === "trust" ||
    stored === "obligation" ||
    stored === "livelihood" ||
    stored === "mixed" ||
    stored === "unknown";
  const qualityClass: TrustParticipationQualityClass = hasStored
    ? stored
    : "unknown";
  const notes: string[] = [];

  if (!hasStored) {
    notes.push(
      "Motivation was not recorded; class is unknown. Attendance and high willingness do not imply trust.",
    );
  } else if (qualityClass === "mixed") {
    notes.push("Mixed motive is not treated as weak participation.");
  } else if (qualityClass === "obligation") {
    notes.push("Obligation motive is not treated as weak participation.");
  } else if (qualityClass === "livelihood") {
    notes.push("Livelihood motive is not treated as weak participation.");
  } else if (qualityClass === "trust") {
    notes.push("Class is stored motivation (trust), not inferred from attendance.");
  }

  if (
    row.willingnessToParticipate === "high" &&
    mixedMotivationDoesNotEqualTrust(qualityClass)
  ) {
    notes.push(
      "High willingness does not reclassify this row as trust quality.",
    );
  }

  if (
    row.presenceMode === "in_person" ||
    row.presenceMode === "proxy" ||
    row.presenceMode === "household_rep" ||
    attendanceIsNotConsent(row)
  ) {
    notes.push("Presence or attendance is not read as consent.");
  }

  const treatedAsWeak = row.willingnessToParticipate === "low";

  return {
    id: row.id,
    qualityClass,
    classSource: hasStored ? "stored_motivation" : "unspecified",
    consentImplied: false,
    attendanceDoesNotEqualConsent: true,
    treatedAsWeak,
    notes,
  };
}

export function formatParticipationQualityMix(
  index: Pick<TrustParticipationQualityIndex, "byClass" | "total">,
): string {
  if (index.total === 0) return "none recorded";
  return TRUST_PARTICIPATION_QUALITY_CLASSES.map(
    (key) => `${TRUST_PARTICIPATION_QUALITY_LABELS[key].toLowerCase()} ${index.byClass[key]}`,
  ).join(" · ");
}

export function summarizeParticipationQuality(
  rows: TrustParticipationRecord[],
): TrustParticipationQualityIndex {
  const byClass = emptyByClass();
  if (!rows.length) {
    return {
      total: 0,
      byClass,
      unspecified: 0,
      consentImpliedCount: 0,
      attendanceNotConsentCount: 0,
      weakByWillingnessOnly: 0,
      mixedIsNotWeak: true,
      attendanceIsNotConsent: true,
      notes: [],
    };
  }

  const readings = rows.map(classifyParticipationQuality);
  let unspecified = 0;
  let attendanceNotConsentCount = 0;
  let weakByWillingnessOnly = 0;
  const notes: string[] = [
    "Participation quality is a count of stored motive classes. Mixed is not weak. Attendance is not consent. This mix is not Trust pulse.",
  ];

  for (const reading of readings) {
    byClass[reading.qualityClass] += 1;
    if (reading.classSource === "unspecified") unspecified += 1;
    attendanceNotConsentCount += 1;
    if (reading.treatedAsWeak) weakByWillingnessOnly += 1;
  }

  notes.push(...summarizeParticipationRealismForIntel(rows));

  return {
    total: rows.length,
    byClass,
    unspecified,
    consentImpliedCount: 0,
    attendanceNotConsentCount,
    weakByWillingnessOnly,
    mixedIsNotWeak: true,
    attendanceIsNotConsent: true,
    notes: uniqueNotes(notes),
  };
}

export function summarizeParticipationQualityForIntel(
  rows: TrustParticipationRecord[],
): string[] {
  if (!rows.length) return [];
  const index = summarizeParticipationQuality(rows);
  return uniqueNotes([
    `Participation quality: ${formatParticipationQualityMix(index)}. Mixed, obligation, and livelihood are not treated as weak. Attendance is not consent. This mix is not Trust pulse.`,
    ...index.notes.filter(
      (line) =>
        !line.startsWith("Participation quality is a count"),
    ),
  ]);
}

/**
 * Weak-participation reading uses explicit low willingness only.
 * Mixed / obligation / livelihood / unknown motive never invents the alert.
 */
export function participationQualityLooksWeak(
  rows: TrustParticipationRecord[],
): boolean {
  if (!rows.length) return false;
  const high = rows.filter((row) => row.willingnessToParticipate === "high")
    .length;
  const weak = rows.filter((row) => classifyParticipationQuality(row).treatedAsWeak)
    .length;
  return weak > high || (high === 0 && weak > 0);
}
