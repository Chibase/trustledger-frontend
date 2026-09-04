/**
 * Participation realism — mixed motives, presence vs consent, non-simplistic response.
 * Does not change `participationLooksTrustDriven`.
 */

import type {
  TrustParticipationMotivation,
  TrustParticipationRecord,
  TrustPresenceMode,
  TrustResponsePattern,
} from "@/types/trustLayer";

export function mixedMotivationDoesNotEqualTrust(
  motivation?: TrustParticipationMotivation,
): boolean {
  return (
    !motivation ||
    motivation === "mixed" ||
    motivation === "obligation" ||
    motivation === "livelihood" ||
    motivation === "unknown"
  );
}

/** Presence (including proxy / household representative) is not consent. */
export function attendanceIsNotConsent(
  row: Pick<
    TrustParticipationRecord,
    "attendanceDoesNotEqualConsent" | "presenceMode"
  >,
): boolean {
  if (row.attendanceDoesNotEqualConsent === true) return true;
  return row.presenceMode === "proxy" || row.presenceMode === "household_rep";
}

export function responsePatternIsNotSimpleAttendance(
  pattern?: TrustResponsePattern,
): boolean {
  return (
    !pattern ||
    pattern === "quiet_presence" ||
    pattern === "walkout" ||
    pattern === "mixed" ||
    pattern === "unknown"
  );
}

/**
 * Mixed / obligation / livelihood rows must not be treated as automatically
 * weak or automatically trust-driven. Only explicit low willingness is weak.
 */
export function motivationDoesNotInflateWeakParticipation(
  row: Pick<TrustParticipationRecord, "motivation" | "willingnessToParticipate">,
): boolean {
  if (!mixedMotivationDoesNotEqualTrust(row.motivation)) return true;
  return row.willingnessToParticipate !== "low";
}

export function summarizeParticipationRealismForIntel(
  rows: TrustParticipationRecord[],
): string[] {
  if (!rows.length) return [];
  const hints: string[] = [];
  const mixed = rows.filter(
    (row) =>
      row.motivation === "mixed" ||
      row.motivation === "obligation" ||
      row.motivation === "livelihood",
  );
  if (mixed.length) {
    hints.push(
      "Participation includes mixed or non-trust motives (obligation, livelihood, or mixed). That does not by itself mean weak participation or consent.",
    );
  }
  if (rows.some((row) => attendanceIsNotConsent(row))) {
    hints.push(
      "Attendance or proxy / household presence is recorded as not equal to consent.",
    );
  }
  if (
    rows.some(
      (row) =>
        row.responsePattern === "quiet_presence" ||
        row.responsePattern === "walkout" ||
        row.responsePattern === "mixed",
    )
  ) {
    hints.push(
      "Community response includes quiet presence, walkout, or mixed patterns — not only vocal agreement.",
    );
  }
  return hints;
}

export function asParticipationMotivation(
  value: unknown,
): TrustParticipationMotivation | undefined {
  if (
    value === "trust" ||
    value === "obligation" ||
    value === "livelihood" ||
    value === "mixed" ||
    value === "unknown"
  ) {
    return value;
  }
  return undefined;
}

export function asPresenceMode(value: unknown): TrustPresenceMode | undefined {
  if (
    value === "in_person" ||
    value === "proxy" ||
    value === "household_rep" ||
    value === "unknown"
  ) {
    return value;
  }
  return undefined;
}

export function asResponsePattern(
  value: unknown,
): TrustResponsePattern | undefined {
  if (
    value === "vocal" ||
    value === "quiet_presence" ||
    value === "walkout" ||
    value === "mixed" ||
    value === "unknown"
  ) {
    return value;
  }
  return undefined;
}
