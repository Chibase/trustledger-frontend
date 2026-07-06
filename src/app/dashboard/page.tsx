import Link from "next/link";
import { isUserRole, USER_ROLES, type UserRole } from "@/types/rbac";

type DashboardPageProps = {
  searchParams: Promise<{ view?: string }>;
};

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

function resolveView(view: string | undefined): UserRole {
  if (view && isUserRole(view)) {
    return view;
  }
  return "client";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { view } = await searchParams;
  const activeRole = resolveView(view);
  const content = ROLE_CONTENT[activeRole];

  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <nav className="flex flex-wrap gap-2 mb-6">
        {USER_ROLES.map((role) => (
          <Link
            key={role}
            href={`/dashboard?view=${role}`}
            className={`rounded-md border px-3 py-1 text-sm capitalize ${
              role === activeRole
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {role}
          </Link>
        ))}
      </nav>

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
