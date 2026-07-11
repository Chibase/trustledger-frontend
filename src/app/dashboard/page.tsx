import Link from "next/link";
import { getCurrentUser, type UserRole } from "@/lib/auth";
import { SignOutButton } from "@/app/dashboard/sign-out-button";
import { ReportBriefAssist } from "@/components/ai/ReportBriefAssist";

const ROLE_CONTENT: Record<
  UserRole,
  {
    title: string;
    items: [string, string, string];
    aiLinks: { href: string; label: string; note: string }[];
  }
> = {
  client: {
    title: "Client Dashboard",
    items: [
      "Track funded project progress and milestones",
      "Review budget spend against approved allocations",
      "Download compliance and audit reports",
    ],
    aiLinks: [
      {
        href: "/incidents",
        label: "Review incidents",
        note: "Open cases feeding risk and SLA pressure",
      },
      {
        href: "/projects",
        label: "Projects",
        note: "Budget and ward context for briefs",
      },
    ],
  },
  contractor: {
    title: "Contractor Dashboard",
    items: [
      "Submit work progress and site updates",
      "Upload invoices and supporting documents",
      "View assigned projects and delivery deadlines",
    ],
    aiLinks: [
      {
        href: "/incidents",
        label: "Site-linked incidents",
        note: "Draft updates and evidence follow-ups",
      },
      {
        href: "/issues/report",
        label: "Log a field concern",
        note: "AI triage before it becomes a formal case",
      },
    ],
  },
  community: {
    title: "Community Dashboard",
    items: [
      "See public project status in your ward",
      "Report issues or concerns on active work",
      "Access community feedback and meeting notes",
    ],
    aiLinks: [
      {
        href: "/issues/report",
        label: "Report an issue",
        note: "AI helps categorize and prioritize — you confirm",
      },
      {
        href: "/incidents",
        label: "View open concerns",
        note: "Track status of reported issues",
      },
    ],
  },
  admin: {
    title: "Admin Dashboard",
    items: [
      "Manage users, roles, and project access",
      "Approve budgets, changes, and milestone releases",
      "Monitor system activity and audit trails",
    ],
    aiLinks: [
      {
        href: "/incidents",
        label: "Incident desk",
        note: "Sentiment, drafts, and escalation context",
      },
      {
        href: "/issues/report",
        label: "Assisted intake",
        note: "Test triage hooks end-to-end",
      },
    ],
  },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
        <section className="rounded-lg border p-4 text-sm text-gray-700">
          <p className="mb-2 font-medium text-gray-900">Please sign in</p>
          <p>You need to be signed in to view your role-based dashboard.</p>
        </section>
      </main>
    );
  }

  const content = ROLE_CONTENT[user.role];
  const showBrief = user.role === "client" || user.role === "admin";

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Signed in as:{" "}
            <span className="font-medium text-gray-900">
              {user.name} ({user.role})
            </span>
          </p>
          <SignOutButton />
        </div>
      </div>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-xl font-semibold">{content.title}</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
          {content.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-1 text-lg font-semibold">AI-assisted workflows</h2>
        <p className="mb-4 text-sm text-gray-600">
          UI hooks for continuous Grok capabilities. Suggestions are never
          auto-applied to the system of record.
        </p>
        <ul className="space-y-3">
          {content.aiLinks.map((link) => (
            <li key={link.href} className="text-sm">
              <Link href={link.href} className="font-medium underline">
                {link.label}
              </Link>
              <p className="text-gray-600">{link.note}</p>
            </li>
          ))}
        </ul>
      </section>

      {showBrief ? <ReportBriefAssist /> : null}
    </main>
  );
}
