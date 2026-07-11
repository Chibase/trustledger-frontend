import Link from "next/link";
import {
  IncidentStatusChip,
  PriorityChip,
  SlaChip,
} from "@/components/ui/StatusChip";
import type { Incident } from "@/types/incident";

type IncidentTableProps = {
  incidents: Incident[];
  emptyLabel?: string;
  showSla?: boolean;
};

export function IncidentTable({
  incidents,
  emptyLabel = "No incidents to show.",
  showSla = true,
}: IncidentTableProps) {
  if (incidents.length === 0) {
    return <p className="text-sm text-tl-ink-muted">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-tl-line bg-tl-surface shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-tl-line bg-tl-ink/[0.03] text-xs uppercase tracking-wide text-tl-ink-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">ID</th>
            <th className="px-4 py-2.5 font-medium">Title</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Priority</th>
            {showSla ? (
              <th className="px-4 py-2.5 font-medium">SLA</th>
            ) : null}
            <th className="px-4 py-2.5 font-medium">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-tl-line">
          {incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-tl-paper/60">
              <td className="whitespace-nowrap px-4 py-3 font-medium">
                <Link
                  href={`/app/incidents/${incident.id}`}
                  className="text-tl-trust-ink underline-offset-2 hover:underline"
                >
                  {incident.id}
                </Link>
              </td>
              <td className="max-w-xs px-4 py-3 text-tl-ink">
                <span className="line-clamp-1">{incident.title}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <IncidentStatusChip status={incident.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <PriorityChip priority={incident.priority} />
              </td>
              {showSla ? (
                <td className="whitespace-nowrap px-4 py-3">
                  <SlaChip breached={incident.slaBreached} />
                </td>
              ) : null}
              <td className="whitespace-nowrap px-4 py-3 text-tl-ink-muted">
                {incident.ownerName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
