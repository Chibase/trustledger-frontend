"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { incidentService } from "@/services/incidentService";
import type { Incident, IncidentStatus } from "@/types/incident";

const STATUSES: Array<IncidentStatus | "All"> = [
  "All",
  "Open",
  "Investigating",
  "Escalated",
  "Closed",
];

export default function AppIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [breachedOnly, setBreachedOnly] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    incidentService.list().then((rows) => {
      if (cancelled) return;
      setIncidents(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((incident) => {
      if (status !== "All" && incident.status !== status) return false;
      if (breachedOnly && !incident.slaBreached) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${incident.id} ${incident.title} ${incident.ward}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [incidents, status, breachedOnly, query]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Incidents</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Filter sample SRM cases by status, SLA, or search.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-tl-line bg-tl-surface p-3">
        <div>
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-tl-ink-muted">
            Search
          </label>
          <input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-md border border-tl-line px-3 py-2 text-sm"
            placeholder="ID, title, ward"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-tl-ink-muted">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
            className="rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={breachedOnly}
            onChange={(e) => setBreachedOnly(e.target.checked)}
          />
          SLA breached only
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-tl-ink-muted">Loading incidents…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-tl-line bg-tl-paper text-tl-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Ward</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">SLA</th>
                <th className="px-3 py-2 font-medium">Escalation</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-tl-line last:border-0"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/app/incidents/${incident.id}`}
                      className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
                    >
                      {incident.id}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{incident.title}</td>
                  <td className="px-3 py-2">{incident.ward}</td>
                  <td className="px-3 py-2">{incident.priority}</td>
                  <td className="px-3 py-2">
                    {incident.slaBreached ? (
                      <span className="font-medium text-tl-amber">Breached</span>
                    ) : (
                      "On track"
                    )}
                  </td>
                  <td className="px-3 py-2">{incident.escalationLevel}</td>
                  <td className="px-3 py-2">{incident.status}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-tl-ink-muted">
                    No incidents match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
