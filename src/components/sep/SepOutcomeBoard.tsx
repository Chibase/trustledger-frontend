"use client";

import { useState } from "react";
import type {
  MitigationIntervention,
  PlanOutcomeEvent,
  SepEventSeverity,
  SepOutcomeKind,
  SepExecutionOverlay,
} from "@/types/sepExecution";
import { SEP_OUTCOME_LABELS } from "@/types/sepExecution";
import type { SepInterventionStatus } from "@/types/sepExecution";
import {
  createIntervention,
  createOutcomeEvent,
  setInterventionStatus,
  upsertSepEvent,
  upsertSepIntervention,
} from "@/lib/sepExecutionStore";

type Props = {
  overlay: SepExecutionOverlay;
  viewOverlay?: SepExecutionOverlay;
  canEdit: boolean;
  actor: string;
  onChange: (next: SepExecutionOverlay) => void;
  filterSeverity: SepEventSeverity | "all";
};

export function SepOutcomeBoard({
  overlay,
  viewOverlay,
  canEdit,
  actor,
  onChange,
  filterSeverity,
}: Props) {
  const [kind, setKind] = useState<SepOutcomeKind>("hurdle");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<SepEventSeverity>("medium");
  const [mitFor, setMitFor] = useState("");
  const [mitText, setMitText] = useState("");
  const [taskId, setTaskId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const listed = viewOverlay || overlay;
  const events = listed.events.filter((ev) => {
    if (filterSeverity === "all") return true;
    return ev.severity === filterSeverity;
  });

  function addEvent() {
    setError(null);
    if (title.trim().length < 3) {
      setError("Give the event a short title.");
      return;
    }
    const row: PlanOutcomeEvent = createOutcomeEvent(overlay.planId, {
      kind,
      title: title.trim(),
      description: description.trim() || title.trim(),
      occurredOn: new Date().toISOString().slice(0, 10),
      severity: kind === "success" ? null : severity,
      ownerLabel: actor,
      taskId: taskId || null,
      milestoneId: milestoneId || null,
      status: kind === "success" ? "resolved" : "open",
      sourceKind: null,
      sourceId: null,
    });
    onChange(upsertSepEvent({ ...overlay }, row, actor));
    setTitle("");
    setDescription("");
    setTaskId("");
    setMilestoneId("");
  }

  function addMitigation() {
    setError(null);
    if (!mitFor) {
      setError("Pick the hurdle or failure this intervention addresses.");
      return;
    }
    if (mitText.trim().length < 3) {
      setError("Describe the intervention.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date();
    due.setUTCDate(due.getUTCDate() + 14);
    const row: MitigationIntervention = createIntervention(overlay.planId, {
      eventId: mitFor,
      description: mitText.trim(),
      ownerLabel: actor,
      startOn: today,
      dueOn: due.toISOString().slice(0, 10),
      status: "active",
      outcomeNote: "",
      reviewOn: due.toISOString().slice(0, 10),
    });
    onChange(upsertSepIntervention({ ...overlay }, row, actor));
    setMitText("");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">
          Success, hurdles, failures
        </h3>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-tl-ink-muted">
            No logged outcomes on this plan yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-md border border-tl-line px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
                  {SEP_OUTCOME_LABELS[ev.kind]}
                  {ev.severity ? ` · ${ev.severity}` : ""}
                  {ev.sourceId ? ` · ${ev.sourceKind} ${ev.sourceId}` : ""}
                </p>
                <p className="text-sm font-medium text-tl-ink">{ev.title}</p>
                <p className="text-sm text-tl-ink-muted">{ev.description}</p>
                <p className="mt-1 text-xs text-tl-ink-muted">
                  {ev.occurredOn} · {ev.ownerLabel} · {ev.status}
                </p>
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <div className="mt-4 space-y-2 border-t border-tl-line pt-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Log an outcome</span>
              <select
                value={kind}
                aria-label="Outcome kind"
                onChange={(e) => setKind(e.target.value as SepOutcomeKind)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <option value="success">Success</option>
                <option value="hurdle">Hurdle</option>
                <option value="failure">Failure</option>
              </select>
            </label>
            {kind !== "success" ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Severity</span>
                <select
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as SepEventSeverity)
                  }
                  className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            ) : null}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened"
              rows={2}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
            {overlay.tasks.length > 0 ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Linked task</span>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {overlay.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {overlay.milestones.length > 0 ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Linked milestone</span>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {overlay.milestones.map((mile) => (
                    <option key={mile.id} value={mile.id}>
                      {mile.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button
              type="button"
              onClick={addEvent}
              className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Save event
            </button>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">
          Mitigating interventions
        </h3>
        {listed.interventions.length === 0 ? (
          <p className="mt-2 text-sm text-tl-ink-muted">
            No interventions yet. Link one to an open hurdle or failure.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {listed.interventions.map((row) => {
              const ev =
                overlay.events.find((item) => item.id === row.eventId) ||
                listed.events.find((item) => item.id === row.eventId);
              return (
                <li
                  key={row.id}
                  className="rounded-md border border-tl-line px-3 py-2"
                >
                  <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
                    {row.status} · due {row.dueOn}
                  </p>
                  <p className="text-sm text-tl-ink">{row.description}</p>
                  <p className="text-xs text-tl-ink-muted">
                    For {ev?.title || row.eventId} · {row.ownerLabel}
                    {row.outcomeNote ? ` · ${row.outcomeNote}` : ""}
                  </p>
                  {canEdit ? (
                    <label className="mt-2 block text-xs">
                      <span className="sr-only">Intervention status</span>
                      <select
                        value={row.status}
                        aria-label={`Status for ${row.description}`}
                        onChange={(e) =>
                          onChange(
                            setInterventionStatus(
                              { ...overlay },
                              row.id,
                              e.target.value as SepInterventionStatus,
                              "",
                              actor,
                            ),
                          )
                        }
                        className="mt-1 rounded-md border border-tl-line px-2 py-1 text-xs"
                      >
                        <option value="planned">Planned</option>
                        <option value="active">Active</option>
                        <option value="done">Effective</option>
                        <option value="ineffective">Ineffective</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {canEdit ? (
          <div className="mt-4 space-y-2 border-t border-tl-line pt-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Linked event</span>
              <select
                value={mitFor}
                aria-label="Linked event"
                onChange={(e) => setMitFor(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <option value="">Select hurdle or failure</option>
                {overlay.events
                  .filter((ev) => ev.kind !== "success")
                  .map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
              </select>
            </label>
            <textarea
              value={mitText}
              onChange={(e) => setMitText(e.target.value)}
              placeholder="Intervention"
              rows={2}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addMitigation}
              className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
            >
              Add intervention
            </button>
          </div>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-tl-danger" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
