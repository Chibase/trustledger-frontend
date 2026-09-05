"use client";

import { useState } from "react";
import {
  PROCESS_STAGE_LABELS,
  advanceIncidentStage,
  nextPendingStage,
  ensureProcessStages,
  reasonCannotStampStage,
  verifyAndCloseIncident,
} from "@/lib/grievanceProcess";
import {
  rootCauseLabel,
  validateGrievanceRootCause,
} from "@/lib/grievanceRootCause";
import { incidentService } from "@/services/incidentService";
import type { Incident } from "@/types/incident";
import { RootCauseFields } from "@/components/incidents/RootCauseFields";

type ProcessStageActionsProps = {
  incident: Incident;
  onUpdated: (next: Incident) => void;
  onToast: (message: string, kind?: "success" | "error" | "info") => void;
};

export function ProcessStageActions({
  incident,
  onUpdated,
  onToast,
}: ProcessStageActionsProps) {
  const [pending, setPending] = useState(false);
  const [cause, setCause] = useState(incident.rootCause ?? "");
  const [note, setNote] = useState(incident.rootCauseNote ?? "");
  const stages = ensureProcessStages(incident);
  const next = nextPendingStage(stages);
  const canVerifyClose = Boolean(stages.resolvedAt) && !stages.closedAt;
  const tagged = (): Incident => {
    const check = validateGrievanceRootCause(cause, note);
    if (!check.ok) return incident;
    return {
      ...incident,
      rootCause: check.id,
      rootCauseNote: check.note || undefined,
    };
  };

  async function persist(nextIncident: Incident, message: string) {
    setPending(true);
    try {
      const saved = await incidentService.save(nextIncident);
      onUpdated(saved);
      onToast(message, "success");
    } catch {
      onToast("Could not save stage change", "error");
    } finally {
      setPending(false);
    }
  }

  function stampNext() {
    if (!next) return;
    const row = tagged();
    const blocked = reasonCannotStampStage(row, next);
    if (blocked) {
      onToast(blocked, "error");
      return;
    }
    void persist(
      advanceIncidentStage(row, { actor: "Case desk" }),
      `Stamped: ${PROCESS_STAGE_LABELS[next]}`,
    );
  }

  function saveTag() {
    const check = validateGrievanceRootCause(cause, note);
    if (!check.ok) {
      onToast(check.reason, "error");
      return;
    }
    void persist(tagged(), "Root-cause tag saved");
  }

  if (!next && stages.closedAt) {
    return (
      <div className="mt-3 space-y-2">
        {incident.rootCause ? (
          <p className="text-xs text-tl-ink-muted">
            Root cause:{" "}
            <span className="font-medium text-tl-ink">
              {rootCauseLabel(incident.rootCause)}
            </span>
            {incident.rootCauseNote ? ` — ${incident.rootCauseNote}` : ""}
          </p>
        ) : null}
        <p className="text-xs text-tl-ink-muted">
          Lifecycle complete — case is verified and closed.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <RootCauseFields
        cause={cause}
        note={note}
        onCause={setCause}
        onNote={setNote}
        disabled={pending}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={saveTag}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save root cause"}
        </button>
        {next && next !== "closed" ? (
          <button
            type="button"
            disabled={pending}
            onClick={stampNext}
            className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {pending
              ? "Saving…"
              : `Advance → ${PROCESS_STAGE_LABELS[next]}`}
          </button>
        ) : null}

        {canVerifyClose ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void persist(
                verifyAndCloseIncident(tagged(), { actor: "Case desk" }),
                "Verified and closed",
              )
            }
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper disabled:opacity-50"
          >
            Verify &amp; close
          </button>
        ) : null}

        {next === "closed" && !canVerifyClose ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              void persist(
                advanceIncidentStage(tagged(), {
                  to: "closed",
                  actor: "Case desk",
                }),
                "Closed",
              )
            }
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
          >
            Close case
          </button>
        ) : null}
      </div>
    </div>
  );
}
