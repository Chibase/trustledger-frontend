"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  createMelIndicatorId,
  formatMelNumber,
  varianceForIndicator,
} from "@/lib/melIndicators";
import { projectService } from "@/services/projectService";
import type { MelIndicator } from "@/types/mel";
import type { Project } from "@/types/project";

type Props = {
  project: Project;
  onSaved: (next: Project) => void;
};

function parseInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function ProjectMelPanel({ project, onSaved }: Props) {
  const { pushToast } = useToast();
  const [rows, setRows] = useState<MelIndicator[]>(
    () => project.melIndicators || [],
  );
  const [saving, setSaving] = useState(false);

  function patch(id: string, next: Partial<MelIndicator>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...next } : row)),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: createMelIndicatorId(),
        label: "",
        unit: "people",
        expected: null,
        actual: null,
      },
    ]);
  }

  async function save() {
    const cleaned = rows.filter((row) => row.label.trim());
    setSaving(true);
    try {
      const next = await projectService.save({
        ...project,
        melIndicators: cleaned,
      });
      setRows(next.melIndicators || cleaned);
      onSaved(next);
      pushToast("M&E indicators saved.", "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Could not save M&E indicators.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-base font-semibold text-tl-ink">
          Expected vs actual
        </h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Track named targets on this project (for example beneficiaries 1,000
          expected vs 620 actual). A gap is a watch, not a cause. Live
          workspaces save on TrustLedger Cloud.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-tl-ink-muted">No indicators yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const gap = varianceForIndicator(row, {
              projectId: project.id,
              projectName: project.name,
            });
            return (
              <li
                key={row.id}
                className="space-y-2 rounded-md border border-tl-line px-3 py-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Indicator</span>
                    <input
                      value={row.label}
                      onChange={(e) => patch(row.id, { label: e.target.value })}
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                      placeholder="People reached"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Unit</span>
                    <input
                      value={row.unit}
                      onChange={(e) => patch(row.id, { unit: e.target.value })}
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                      placeholder="people, %, ZAR"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Expected</span>
                    <input
                      inputMode="decimal"
                      value={row.expected ?? ""}
                      onChange={(e) =>
                        patch(row.id, { expected: parseInput(e.target.value) })
                      }
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Actual</span>
                    <input
                      inputMode="decimal"
                      value={row.actual ?? ""}
                      onChange={(e) =>
                        patch(row.id, { actual: parseInput(e.target.value) })
                      }
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                {gap ? (
                  <p
                    className={`text-xs ${
                      gap.material ? "text-tl-amber" : "text-tl-ink-muted"
                    }`}
                  >
                    Actual {formatMelNumber(gap.actual, row.unit)} is below
                    expected {formatMelNumber(gap.expected, row.unit)}
                    {gap.material ? " (material shortfall)." : "."} This is not
                    a cause.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-medium text-tl-danger underline"
                  onClick={() =>
                    setRows((current) => current.filter((r) => r.id !== row.id))
                  }
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-semibold text-tl-ink hover:bg-tl-paper"
        >
          Add indicator
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-md bg-tl-trust px-3 py-1.5 text-xs font-semibold text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save M&E"}
        </button>
      </div>
    </section>
  );
}
