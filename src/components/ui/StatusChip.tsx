import type { IncidentPriority, IncidentStatus } from "@/types/incident";
import type { ProjectStatus } from "@/types/project";

const base =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  const tone =
    status === "Active"
      ? "bg-tl-trust/10 text-tl-trust-ink ring-tl-trust/25"
      : status === "Completed" || status === "Closed"
        ? "bg-tl-paper text-tl-ink-muted ring-tl-line"
        : status === "OnHold"
          ? "bg-tl-amber/10 text-tl-amber ring-tl-amber/30"
          : "bg-tl-paper text-tl-ink ring-tl-line";

  return <span className={`${base} ${tone}`}>{status}</span>;
}

export function IncidentStatusChip({ status }: { status: IncidentStatus }) {
  const tone =
    status === "Closed"
      ? "bg-tl-paper text-tl-ink-muted ring-tl-line"
      : status === "Escalated"
        ? "bg-tl-danger/10 text-tl-danger ring-tl-danger/25"
        : status === "Investigating"
          ? "bg-tl-demo/10 text-tl-demo ring-tl-demo/25"
          : "bg-tl-trust/10 text-tl-trust-ink ring-tl-trust/25";

  return <span className={`${base} ${tone}`}>{status}</span>;
}

export function PriorityChip({ priority }: { priority: IncidentPriority }) {
  const tone =
    priority === "P1-Critical"
      ? "bg-tl-danger/10 text-tl-danger ring-tl-danger/25"
      : priority === "P2-High"
        ? "bg-tl-amber/10 text-tl-amber ring-tl-amber/30"
        : priority === "P3-Medium"
          ? "bg-tl-demo/10 text-tl-demo ring-tl-demo/25"
          : "bg-tl-paper text-tl-ink-muted ring-tl-line";

  return <span className={`${base} ${tone}`}>{priority}</span>;
}

export function SlaChip({ breached }: { breached: boolean }) {
  if (!breached) {
    return (
      <span className={`${base} bg-tl-trust/10 text-tl-trust-ink ring-tl-trust/25`}>
        On track
      </span>
    );
  }
  return (
    <span className={`${base} bg-tl-amber/10 text-tl-amber ring-tl-amber/30`}>
      SLA breached
    </span>
  );
}
