import Link from "next/link";
import { mockIncidents } from "@/data/mockIncidents";

export default function IncidentsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/dashboard" className="underline">
            Dashboard
          </Link>{" "}
          / Incidents
        </p>
        <h1 className="mt-2 text-2xl font-bold">Incidents</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sample cases for AI assist hooks (draft response, sentiment, brief).
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-gray-600">
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
              <tr key={incident.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <Link
                    href={`/incidents/${incident.id}`}
                    className="font-medium underline"
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
    </main>
  );
}
