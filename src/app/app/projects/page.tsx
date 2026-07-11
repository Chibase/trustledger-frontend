import { projectService } from "@/services/projectService";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

export default async function AppProjectsPage() {
  const projects = await projectService.list();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold">Projects</h1>

      <div className="overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
        <table className="min-w-full text-sm">
          <thead className="border-b border-tl-line bg-tl-paper text-tl-ink-muted">
            <tr>
              <th className="p-3 text-left font-medium">ID</th>
              <th className="p-3 text-left font-medium">Name</th>
              <th className="p-3 text-left font-medium">Client/Funder</th>
              <th className="p-3 text-left font-medium">Budget</th>
              <th className="p-3 text-left font-medium">Ward</th>
              <th className="p-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t border-tl-line">
                <td className="p-3">{p.id}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">{p.clientFunder}</td>
                <td className="p-3">{currency.format(p.budgetTotal)}</td>
                <td className="p-3">{p.ward}</td>
                <td className="p-3">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
