import {
  activityLabel,
  type OpsActivityKind,
  type OpsActivityRow,
} from "@/lib/opsIntel";

export type OpsReportFilter = {
  activity?: OpsActivityKind | "all";
  source?: string;
  q?: string;
};

export function filterOpsActivityRows(
  rows: OpsActivityRow[],
  opts: OpsReportFilter = {},
): OpsActivityRow[] {
  let next = rows;
  const activity = opts.activity || "all";
  if (activity !== "all") {
    next = next.filter((row) => row.activity === activity);
  }
  const source = opts.source?.trim().toLowerCase();
  if (source) {
    next = next.filter((row) => (row.source || "").toLowerCase() === source);
  }
  const q = opts.q?.trim().toLowerCase();
  if (q) {
    next = next.filter((row) =>
      [row.lead_name, row.email, row.organization, row.job_title, row.intent]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }
  return next;
}

function csvCell(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export function opsActivityToCsv(rows: OpsActivityRow[]): string {
  const header = [
    "when",
    "who",
    "email",
    "organization",
    "activity",
    "intent",
    "source",
    "status",
    "rating",
    "readiness",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.modified),
        csvCell(row.lead_name || row.name),
        csvCell(row.email),
        csvCell(row.organization),
        csvCell(activityLabel(row.activity)),
        csvCell(row.intent),
        csvCell(row.source),
        csvCell(row.status),
        csvCell(row.rating),
        csvCell(row.readiness),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
