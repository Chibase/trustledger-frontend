import {
  PROCESS_STAGE_KEYS,
  PROCESS_STAGE_LABELS,
  hoursBetween,
  stageTimestamp,
  type ProcessStageKey,
} from "@/lib/grievanceProcess";
import type { Incident } from "@/types/incident";

type ProcessStageTimelineProps = {
  incident: Incident;
};

export function ProcessStageTimeline({ incident }: ProcessStageTimelineProps) {
  const stages = incident.processStages;
  if (!stages) {
    return (
      <p className="text-sm text-tl-ink-muted">
        No process stage timestamps on this case yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {PROCESS_STAGE_KEYS.map((key, index) => {
        const at = stageTimestamp(stages, key);
        const prevKey =
          index > 0 ? (PROCESS_STAGE_KEYS[index - 1] as ProcessStageKey) : null;
        const prevAt = prevKey ? stageTimestamp(stages, prevKey) : null;
        const lag =
          at && prevAt ? hoursBetween(prevAt, at) : !at && prevAt
            ? hoursBetween(prevAt, new Date().toISOString())
            : null;
        const target =
          key === "reported" ? undefined : stages.targetHours?.[key];
        const over =
          typeof target === "number" &&
          lag !== null &&
          !at &&
          lag > target;

        return (
          <li
            key={key}
            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-tl-line pb-2 text-sm last:border-0"
          >
            <div>
              <p className="font-medium text-tl-ink">
                {PROCESS_STAGE_LABELS[key]}
              </p>
              <p className="text-xs text-tl-ink-muted">
                {at
                  ? new Date(at).toLocaleString()
                  : "Pending"}
                {typeof target === "number" ? ` · target ${target}h` : ""}
              </p>
            </div>
            {lag !== null ? (
              <span
                className={`text-xs font-medium tabular-nums ${
                  over ? "text-tl-amber" : "text-tl-ink-muted"
                }`}
              >
                {at ? `${lag}h stage` : `${lag}h elapsed`}
                {over ? " · over target" : ""}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
