"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { GRIEVANCE_ROOT_CAUSES, parseGrievanceRootCause, rootCauseLabel } from "@/lib/grievanceRootCause";
import {
  completeMelAdaptRecord,
  createMelAdaptId,
  reasonCannotCompleteAdapt,
} from "@/lib/melLearnAdapt";
import { incidentService } from "@/services/incidentService";
import type { Incident } from "@/types/incident";
import type { MelLearnAdaptRecord } from "@/types/melAdapt";

type Props = {
  incident: Incident;
  onSaved: (next: Incident) => void;
};

export function LearnAdaptPanel({ incident, onSaved }: Props) {
  const { pushToast } = useToast();
  const [rows, setRows] = useState<MelLearnAdaptRecord[]>(
    () => incident.learnAdaptRecords || [],
  );
  const [saving, setSaving] = useState(false);

  function patch(id: string, next: Partial<MelLearnAdaptRecord>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...next } : row)),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: createMelAdaptId(),
        monitor: "",
        analyse: "",
        action: "",
        rootCause: incident.rootCause,
        ownerLabel: incident.ownerName || "",
        status: "open",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async function persist(nextRows: MelLearnAdaptRecord[], message: string) {
    const cleaned = nextRows.filter((row) => row.monitor.trim());
    const hadRecords = incident.learnAdaptRecords !== undefined;
    if (cleaned.length === 0 && !hadRecords) {
      pushToast("Add a Monitor observation before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      const next = await incidentService.save({
        ...incident,
        learnAdaptRecords: cleaned,
      });
      setRows(next.learnAdaptRecords || cleaned);
      onSaved(next);
      pushToast(message, "success");
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Could not save Learn & Adapt.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function markDone(id: string) {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    const blocked = reasonCannotCompleteAdapt(row);
    if (blocked) {
      pushToast(blocked, "error");
      return;
    }
    const nextRows = rows.map((item) =>
      item.id === id ? completeMelAdaptRecord(item) : item,
    );
    void persist(nextRows, "Learn & Adapt record marked done. Case stages unchanged.");
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-base font-semibold text-tl-ink">
          Learn &amp; Adapt
        </h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Monitor → Analyse → Adapt is a corrective-action record. It does not
          replace reported → deploy → investigate → resolve → verify → close.
          Marking a record done does not close the case.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-tl-ink-muted">
          No Learn &amp; Adapt records on this case yet.
        </p>
      ) : null}

      {rows.map((row) => (
        <div
          key={row.id}
          className="space-y-2 rounded-md border border-tl-line bg-tl-paper/60 p-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-medium text-tl-ink-muted">
              {row.status === "done" ? "Done" : "Open"}
              {row.rootCause
                ? ` · ${rootCauseLabel(parseGrievanceRootCause(row.rootCause))}`
                : ""}
            </p>
            {row.status === "open" ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => markDone(row.id)}
                className="text-xs font-medium text-tl-trust-ink underline disabled:opacity-50"
              >
                Mark done
              </button>
            ) : (
              <span className="text-xs text-tl-ink-muted">
                {row.completedAt
                  ? new Date(row.completedAt).toLocaleDateString("en-ZA")
                  : "Done"}
              </span>
            )}
          </div>
          <label className="block text-xs font-medium text-tl-ink">
            Monitor
            <textarea
              value={row.monitor}
              disabled={saving || row.status === "done"}
              onChange={(event) => patch(row.id, { monitor: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
              placeholder="What did we observe?"
            />
          </label>
          <label className="block text-xs font-medium text-tl-ink">
            Analyse
            <textarea
              value={row.analyse}
              disabled={saving || row.status === "done"}
              onChange={(event) => patch(row.id, { analyse: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
              placeholder="Why did it happen?"
            />
          </label>
          <label className="block text-xs font-medium text-tl-ink">
            Adapt
            <textarea
              value={row.action}
              disabled={saving || row.status === "done"}
              onChange={(event) => patch(row.id, { action: event.target.value })}
              rows={2}
              className="mt-1 w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
              placeholder="What will we change?"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs font-medium text-tl-ink">
              Owner
              <input
                value={row.ownerLabel || ""}
                disabled={saving || row.status === "done"}
                onChange={(event) =>
                  patch(row.id, { ownerLabel: event.target.value })
                }
                className="mt-1 w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-tl-ink">
              Due
              <input
                type="date"
                value={row.dueOn || ""}
                disabled={saving || row.status === "done"}
                onChange={(event) => patch(row.id, { dueOn: event.target.value })}
                className="mt-1 w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-tl-ink">
            Linked root cause
            <select
              value={row.rootCause || ""}
              disabled={saving || row.status === "done"}
              onChange={(event) =>
                patch(row.id, { rootCause: event.target.value || undefined })
              }
              className="mt-1 w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {GRIEVANCE_ROOT_CAUSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={addRow}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper disabled:opacity-50"
        >
          Add record
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void persist(rows, "Learn & Adapt saved.")}
          className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Learn & Adapt"}
        </button>
      </div>
    </section>
  );
}
