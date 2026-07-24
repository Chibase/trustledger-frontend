"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  clearOrgData,
  importOrgCsv,
  orgDataSummary,
} from "@/lib/orgDataSpace";
import { getActiveOrg } from "@/lib/orgStore";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";

const PROJECT_TEMPLATE = `name,client,ward,municipality,contractor,summary
River Crossing Clinic,City Health,Ward 12,Example City,Thari Civils,Upgrade corridor and consultation rooms
`;

const INCIDENT_TEMPLATE = `title,description,project,ward,priority,status,owner
Dust complaint near clinic,Community raised dust from haul road,River Crossing Clinic,Ward 12,P2-High,Open,Site CLO
Water interruption,Borehole pump offline overnight,River Crossing Clinic,Ward 12,P1-Critical,Escalated,Supervisor
`;

/**
 * Plan Owner data space — deposit org projects/cases without demo seed.
 */
export function DataSpacePanel({ isPlanOwner }: { isPlanOwner: boolean }) {
  const { pushToast } = useToast();
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    projects: 0,
    incidents: 0,
    evidence: 0,
    stakeholders: 0,
  });
  const [projectsCsv, setProjectsCsv] = useState("");
  const [incidentsCsv, setIncidentsCsv] = useState("");

  function refresh() {
    const org = getActiveOrg();
    setOrgName(org?.name ?? null);
    setCustomer(isCustomerWorkspaceClient());
    setSummary(orgDataSummary(org?.id));
    setReady(true);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!isPlanOwner) return null;

  function onImport() {
    const result = importOrgCsv({ projectsCsv, incidentsCsv });
    refresh();
    if (result.projects || result.incidents) {
      pushToast(
        `Imported ${result.projects} project(s), ${result.incidents} case(s)`,
        "success",
      );
    }
    if (result.errors.length) {
      pushToast(result.errors[0], "error");
    }
    if (!result.projects && !result.incidents && !result.errors.length) {
      pushToast("Nothing to import — paste CSV with a header row", "error");
    }
  }

  function onClear() {
    if (
      !window.confirm(
        "Clear all projects and cases in this organisation’s data space on this browser?",
      )
    ) {
      return;
    }
    clearOrgData();
    refresh();
    pushToast("Org data space cleared", "success");
  }

  function loadTemplates() {
    setProjectsCsv(PROJECT_TEMPLATE.trim());
    setIncidentsCsv(INCIDENT_TEMPLATE.trim());
  }

  return (
    <section
      id="data-space"
      className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
    >
      <h2 className="font-semibold text-tl-ink">Org data space</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Deposit your own projects and cases (CSV). Customer / trial workspaces
        never mix TrustLedger demo sample rows. Data is stored per organisation
        on this browser until Cloud (T5) becomes the system of record.
      </p>

      {!ready ? (
        <p className="mt-3 text-xs text-tl-ink-muted">Loading data space…</p>
      ) : (
        <>
          <dl className="mt-4 grid gap-2 sm:grid-cols-4">
            {(
              [
                ["Projects", summary.projects],
                ["Cases", summary.incidents],
                ["Evidence", summary.evidence],
                ["Stakeholders", summary.stakeholders],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-tl-line bg-tl-paper/50 px-3 py-2"
              >
                <dt className="text-xs text-tl-ink-muted">{label}</dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-tl-ink-muted">
            Org: {orgName || "none — start trial / subscribe first"}
            {customer ? " · customer mode (no demo seed)" : " · demo mode may show sample data"}
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium">
                Projects CSV
              </span>
              <textarea
                rows={6}
                value={projectsCsv}
                onChange={(e) => setProjectsCsv(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 font-mono text-xs"
                placeholder="name,client,ward,municipality,contractor,summary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium">
                Incidents CSV
              </span>
              <textarea
                rows={6}
                value={incidentsCsv}
                onChange={(e) => setIncidentsCsv(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 font-mono text-xs"
                placeholder="title,description,project,ward,priority,status,owner"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onImport}
              className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Import into org
            </button>
            <button
              type="button"
              onClick={loadTemplates}
              className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Load example CSV
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium text-tl-ink-muted hover:bg-tl-paper"
            >
              Clear org data
            </button>
            <Link
              href="/app/dashboard"
              className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Activity dashboard
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
