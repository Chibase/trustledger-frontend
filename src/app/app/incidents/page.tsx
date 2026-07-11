import Link from "next/link";
import { mockIncidents } from "@/data/mockIncidents";

export default function AppIncidentsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Incidents</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Sample cases for triage, sentiment, and response assist.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-tl-line bg-tl-paper text-tl-ink-muted">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Ward</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockIncidents.map((incident) => (
              <tr key={incident.id} className="border-b border-tl-line last:border-0">
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
                <td className="px-3 py-2">{incident.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
