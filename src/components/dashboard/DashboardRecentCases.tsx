import Link from "next/link";
import { DashboardRecentTable } from "@/components/dashboard/DashboardRecentTable";
import {
  IncidentStatusChip,
  ProjectStatusChip,
} from "@/components/ui/StatusChip";
import { formatDeskDate } from "@/lib/dashboardOverview";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

type CaseProps = {
  incidents: Incident[];
  title?: string;
  empty?: string;
  viewAllHref?: string;
  showProject?: boolean;
};

export function DashboardRecentCases({
  incidents,
  title = "Recent cases",
  empty = "No cases on file yet.",
  viewAllHref = "/app/incidents",
  showProject = true,
}: CaseProps) {
  const columns = [
    { key: "id", header: "ID", className: "whitespace-nowrap" },
    ...(showProject
      ? [{ key: "project", header: "Project", className: "max-w-[10rem]" }]
      : [{ key: "title", header: "Title", className: "max-w-[14rem]" }]),
    { key: "status", header: "Status", className: "whitespace-nowrap" },
    { key: "date", header: "Date", className: "whitespace-nowrap" },
  ];

  const sorted = [...incidents].sort((a, b) =>
    (b.reportedAt || "").localeCompare(a.reportedAt || ""),
  );

  return (
    <DashboardRecentTable
      title={title}
      columns={columns}
      empty={empty}
      viewAllHref={viewAllHref}
      viewAllLabel="Open cases"
      rows={sorted.map((row) => ({
        id: row.id,
        href: `/app/incidents/${encodeURIComponent(row.id)}`,
        values: {
          id: (
            <Link
              href={`/app/incidents/${encodeURIComponent(row.id)}`}
              className="font-medium text-tl-trust-ink hover:underline"
            >
              {row.id}
            </Link>
          ),
          project: (
            <span className="line-clamp-1 text-tl-ink">
              {row.projectName || row.projectId || "—"}
            </span>
          ),
          title: <span className="line-clamp-1 text-tl-ink">{row.title}</span>,
          status: <IncidentStatusChip status={row.status} />,
          date: formatDeskDate(row.reportedAt),
        },
      }))}
    />
  );
}

type ProjectProps = {
  projects: Project[];
  empty?: string;
};

export function DashboardRecentProjects({
  projects,
  empty = "No projects on file yet.",
}: ProjectProps) {
  const sorted = [...projects].sort((a, b) =>
    (b.startDate || b.id).localeCompare(a.startDate || a.id),
  );
  return (
    <DashboardRecentTable
      title="Recent projects"
      viewAllHref="/app/projects"
      viewAllLabel="Open projects"
      empty={empty}
      columns={[
        { key: "id", header: "ID", className: "whitespace-nowrap" },
        { key: "name", header: "Project" },
        { key: "status", header: "Status", className: "whitespace-nowrap" },
        { key: "place", header: "Place" },
      ]}
      rows={sorted.map((row) => ({
        id: row.id,
        href: `/app/projects/${encodeURIComponent(row.id)}`,
        values: {
          id: (
            <Link
              href={`/app/projects/${encodeURIComponent(row.id)}`}
              className="font-medium text-tl-trust-ink hover:underline"
            >
              {row.id}
            </Link>
          ),
          name: <span className="line-clamp-1 text-tl-ink">{row.name}</span>,
          status: <ProjectStatusChip status={row.status} />,
          place: (
            <span className="line-clamp-1 text-tl-ink-muted">
              {row.municipality || row.ward || "—"}
            </span>
          ),
        },
      }))}
    />
  );
}
