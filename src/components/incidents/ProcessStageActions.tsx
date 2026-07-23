"use client";

import { useState } from "react";
import {
  PROCESS_STAGE_LABELS,
  advanceIncidentStage,
  nextPendingStage,
  ensureProcessStages,
  verifyAndCloseIncident,
} from "@/lib/grievanceProcess";
import { incidentService } from "@/services/incidentService";
import type { Incident } from "@/types/incident";

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
  const stages = ensureProcessStages(incident);
  const next = nextPendingStage(stages);
  const canVerifyClose =
    Boolean(stages.resolvedAt) && !stages.closedAt;

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

  if (!next && stages.closedAt) {
    return (
      <p className="mt-3 text-xs text-tl-ink-muted">
        Lifecycle complete — case is verified and closed.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {next && next !== "closed" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            void persist(
              advanceIncidentStage(incident, {
                actor: "Case desk",
              }),
              `Stamped: ${PROCESS_STAGE_LABELS[next]}`,
            )
          }
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
              verifyAndCloseIncident(incident, { actor: "Case desk" }),
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
              advanceIncidentStage(incident, {
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
  );
}
