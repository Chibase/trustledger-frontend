/**
 * MEL-2 — closed root-cause taxonomy on grievances.
 * Nature is what was raised; this tag is why it happened.
 * It is an operational watch, not a trust-movement cause (TE-12).
 */

export const GRIEVANCE_ROOT_CAUSES = [
  { id: "information_gap", label: "Information / communication gap" },
  { id: "unmet_commitment", label: "Unmet or delayed commitment" },
  { id: "process_failure", label: "Process or procedure failure" },
  { id: "contractor_performance", label: "Contractor / subcontractor performance" },
  { id: "consultation_gap", label: "Insufficient consultation" },
  { id: "access_eligibility", label: "Access, eligibility, or list dispute" },
  { id: "livelihood_impact", label: "Compensation / livelihood impact" },
  { id: "protocol_breach", label: "Cultural / traditional protocol breach" },
  { id: "control_failure", label: "Safety or environmental control failure" },
  { id: "third_party", label: "Third party / outside project control" },
  { id: "other", label: "Other" },
] as const;

export type GrievanceRootCauseId = (typeof GRIEVANCE_ROOT_CAUSES)[number]["id"];

const ROOT_CAUSE_IDS = new Set<string>(
  GRIEVANCE_ROOT_CAUSES.map((row) => row.id),
);

export function isGrievanceRootCauseId(
  value: unknown,
): value is GrievanceRootCauseId {
  return typeof value === "string" && ROOT_CAUSE_IDS.has(value);
}

export function parseGrievanceRootCause(
  value: unknown,
): GrievanceRootCauseId | undefined {
  const raw = String(value || "").trim();
  return isGrievanceRootCauseId(raw) ? raw : undefined;
}

export function rootCauseLabel(id: GrievanceRootCauseId | undefined): string {
  if (!id) return "";
  return GRIEVANCE_ROOT_CAUSES.find((row) => row.id === id)?.label || id;
}

export type RootCauseValidation =
  | { ok: true; id: GrievanceRootCauseId; note: string }
  | { ok: false; reason: string };

export function validateGrievanceRootCause(
  id: unknown,
  note?: string | null,
): RootCauseValidation {
  const parsed = parseGrievanceRootCause(id);
  if (!parsed) {
    return {
      ok: false,
      reason: "Pick a root-cause tag before Investigate or Resolve.",
    };
  }
  const trimmed = String(note || "").trim();
  if (parsed === "other" && !trimmed) {
    return {
      ok: false,
      reason: "Other needs a short note describing the cause.",
    };
  }
  return { ok: true, id: parsed, note: parsed === "other" ? trimmed : "" };
}

export function hasValidRootCause(input: {
  rootCause?: unknown;
  rootCauseNote?: string | null;
}): boolean {
  return validateGrievanceRootCause(input.rootCause, input.rootCauseNote).ok;
}

export type RootCauseMixRow = {
  id: GrievanceRootCauseId;
  label: string;
  count: number;
};

/** Counts tagged cases only. Untagged rows are omitted (not “unknown”). */
export function countRootCauses(
  incidents: Array<{ rootCause?: unknown }>,
): RootCauseMixRow[] {
  const counts = new Map<GrievanceRootCauseId, number>();
  for (const row of incidents) {
    const id = parseGrievanceRootCause(row.rootCause);
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return GRIEVANCE_ROOT_CAUSES.map((row) => ({
    id: row.id,
    label: row.label,
    count: counts.get(row.id) || 0,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
