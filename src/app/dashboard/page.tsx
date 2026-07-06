import { getCurrentUser, type UserRole } from "@/lib/auth";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

const ROLE_CONTENT: Record<
  UserRole,
  { title: string; items: [string, string, string] }
> = {
  client: {
    title: "Client Dashboard",
    items: [
      "Track funded project progress and milestones",
      "Review budget spend against approved allocations",
      "Download compliance and audit reports",
    ],
  },
  contractor: {
    title: "Contractor Dashboard",
    items: [
      "Submit work progress and site updates",
      "Upload invoices and supporting documents",
      "View assigned projects and delivery deadlines",
    ],
  },
  community: {
    title: "Community Dashboard",
    items: [
      "See public project status in your ward",
      "Report issues or concerns on active work",
      "Access community feedback and meeting notes",
    ],
  },
  admin: {
    title: "Admin Dashboard",
    items: [
      "Manage users, roles, and project access",
      "Approve budgets, changes, and milestone releases",
      "Monitor system activity and audit trails",
    ],
  },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="p-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <section className="rounded-lg border p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900 mb-2">Please sign in</p>
          <p>You need to be signed in to view your role-based dashboard.</p>
        </section>
      </main>
    );
  }

  const content = ROLE_CONTENT[user.role];

  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-600">
          Signed in as:{" "}
          <span className="font-medium text-gray-900">
            {user.name} ({user.role})
          </span>
        </p>
        <SignOutButton />
      </div>

      <section className="rounded-lg border p-4">
        <h2 className="text-xl font-semibold mb-3">{content.title}</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
          {content.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
