import Link from "next/link";
import { getCurrentUser, type UserRole } from "@/lib/auth";
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
        href: "/app/incidents",
        label: "Review incidents",
        note: "Open cases feeding risk and SLA pressure",
      },
      {
        href: "/app/projects",
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
        href: "/app/incidents",
        label: "Site-linked incidents",
        note: "Draft updates and evidence follow-ups",
      },
      {
        href: "/app/issues/report",
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
        href: "/app/issues/report",
        label: "Report an issue",
        note: "AI helps categorize and prioritize — you confirm",
      },
      {
        href: "/app/incidents",
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
        href: "/app/incidents",
        label: "Incident desk",
        note: "Sentiment, drafts, and escalation context",
      },
      {
        href: "/app/issues/report",
        label: "Assisted intake",
        note: "Test triage hooks end-to-end",
      },
    ],
  },
};

export default async function AppDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const content = ROLE_CONTENT[user.role];
  const showBrief = user.role === "client" || user.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-tl-ink">
          {content.title}
        </h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Role workspace for {user.name}
        </p>
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="mb-3 text-lg font-semibold">Focus areas</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-tl-ink-muted">
          {content.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="mb-1 text-lg font-semibold">AI-assisted workflows</h2>
        <p className="mb-4 text-sm text-tl-ink-muted">
          Suggestions only — confirm before anything is treated as saved.
        </p>
        <ul className="space-y-3">
          {content.aiLinks.map((link) => (
            <li key={link.href} className="text-sm">
              <Link
                href={link.href}
                className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              >
                {link.label}
              </Link>
              <p className="text-tl-ink-muted">{link.note}</p>
            </li>
          ))}
        </ul>
      </section>

      {showBrief ? <ReportBriefAssist /> : null}
    </div>
  );
}
