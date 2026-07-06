import { projectService } from "@/services/projectService";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

export default async function ProjectsPage() {
  const projects = await projectService.list();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Client/Funder</th>
              <th className="text-left p-3">Budget</th>
              <th className="text-left p-3">Ward</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-t">
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
    </main>
  );
}
