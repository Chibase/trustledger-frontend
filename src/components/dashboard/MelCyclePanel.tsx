"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MelAdaptWatch } from "@/components/dashboard/MelAdaptWatch";
import { MelVarianceAlert } from "@/components/dashboard/MelVarianceAlert";
import { RootCauseMix } from "@/components/incidents/RootCauseMix";
import { useToast } from "@/components/ui/Toast";
import { collectMelCycleSuggestions, scopeCommitmentsForMelCycle } from "@/lib/melCycle";
import { collectMelShortfalls } from "@/lib/melIndicators";
import { collectOpenAdaptRecords, createMelAdaptId } from "@/lib/melLearnAdapt";
import { hasCapability } from "@/lib/entitlements";
import { commitmentService } from "@/services/commitmentService";
import { incidentService } from "@/services/incidentService";
import type { PlanId } from "@/config/plans";
import type { Commitment } from "@/types/commitment";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

type Props = {
  projects: Project[];
  incidents: Incident[];
  commitments?: Commitment[];
  planId?: PlanId | null;
  onIncidentSaved?: (next: Incident) => void;
};

export function MelCyclePanel({
  projects,
  incidents,
  commitments,
  planId = null,
  onIncidentSaved,
}: Props) {
  const { pushToast } = useToast();
  const [fetchedCommitments, setFetchedCommitments] = useState<Commitment[]>([]);
  useEffect(() => {
    if (commitments !== undefined) return;
    if (!hasCapability("commitments", planId)) return;
    let cancelled = false;
    void commitmentService
      .list()
      .then((rows) => {
        if (!cancelled) setFetchedCommitments(rows);
      })
      .catch(() => {
        if (!cancelled) setFetchedCommitments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [commitments, planId]);
  const commitmentRows = commitments ?? fetchedCommitments;
  const scopedCommitments = scopeCommitmentsForMelCycle(
    commitmentRows,
    projects,
  );
  const suggestions = useMemo(
    () =>
      collectMelCycleSuggestions({
        projects,
        commitments: scopedCommitments,
        incidents,
      }),
    [projects, scopedCommitments, incidents],
  );
  const gaps = useMemo(
    () => collectMelShortfalls({ projects, commitments: scopedCommitments }),
    [projects, scopedCommitments],
  );
  const openAdapt = useMemo(
    () => collectOpenAdaptRecords(incidents),
    [incidents],
  );
  const hasMix = incidents.some((row) => Boolean(row.rootCause));
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  if (
    gaps.length === 0 &&
    openAdapt.length === 0 &&
    !hasMix &&
    suggestions.length === 0
  ) {
    return null;
  }

  const projectId =
    projects.length === 1 ? projects[0]?.id : suggestions[0]?.projectId;
  const retrospectiveHref = projectId
    ? `/app/reports?kind=mel_retrospective&projectId=${encodeURIComponent(projectId)}`
    : "/app/reports?kind=mel_retrospective";

  async function applySuggestion(indicatorId: string) {
    const row = suggestions.find((item) => item.indicatorId === indicatorId);
    if (!row) return;
    const incidentId = picked[indicatorId] || row.candidates[0]?.id;
    if (!incidentId) {
      pushToast(
        "No case on this project. Log a grievance before applying a Learn & Adapt record. This watch does not invent a case.",
        "error",
      );
      return;
    }
    const current = incidents.find((item) => item.id === incidentId);
    if (!current) {
      pushToast("That case is no longer on the desk.", "error");
      return;
    }
    setSaving(indicatorId);
    try {
      const nextRecord = {
        id: createMelAdaptId(),
        monitor: row.monitor,
        analyse: "",
        action: "",
        status: "open" as const,
        createdAt: new Date().toISOString(),
      };
      const next = await incidentService.save({
        ...current,
        learnAdaptRecords: [...(current.learnAdaptRecords || []), nextRecord],
      });
      pushToast(
        "Learn & Adapt record applied. Write the Adapt action on the case desk. Case stages unchanged.",
        "success",
      );
      onIncidentSaved?.(next);
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Could not apply Learn & Adapt.",
        "error",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
      <div>
        <h2 className="font-display text-sm font-semibold text-tl-ink">
          Learn &amp; Adapt cycle
        </h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Shortfalls and tags are watches, not causes. A suggested Learn &amp;
          Adapt record is suggestion-only — apply it, then write the Adapt
          action on the case. Applying does not close the grievance.{" "}
          <Link href={retrospectiveHref} className="text-tl-trust-ink underline">
            Draft a retrospective
          </Link>
        </p>
      </div>

      <MelVarianceAlert projects={projects} commitments={scopedCommitments} />
      <MelAdaptWatch incidents={incidents} />
      {hasMix ? <RootCauseMix incidents={incidents} /> : null}

      {suggestions.map((row) => (
        <div
          key={row.indicatorId}
          className="rounded-lg border border-dashed border-tl-line bg-tl-paper p-3"
        >
          <p className="text-sm font-medium text-tl-ink">
            Suggest Learn &amp; Adapt — {row.label}
          </p>
          <p className="mt-1 text-xs text-tl-ink-muted">{row.monitor}</p>
          {row.candidates.length ? (
            <label className="mt-2 block text-xs font-medium text-tl-ink">
              Case
              <select
                className="mt-1 w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
                value={picked[row.indicatorId] || row.candidates[0]?.id || ""}
                onChange={(event) =>
                  setPicked((current) => ({
                    ...current,
                    [row.indicatorId]: event.target.value,
                  }))
                }
              >
                {row.candidates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} — {item.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-2 text-xs text-tl-ink-muted">
              No case on this project. Log a grievance before applying. This
              draft does not invent a case or an Adapt action.
            </p>
          )}
          <button
            type="button"
            disabled={saving === row.indicatorId || row.candidates.length === 0}
            onClick={() => void applySuggestion(row.indicatorId)}
            className="mt-2 rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {saving === row.indicatorId
              ? "Applying…"
              : "Apply suggestion"}
          </button>
        </div>
      ))}
    </section>
  );
}
