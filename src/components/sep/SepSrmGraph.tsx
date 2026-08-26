import Link from "next/link";

const NODES = [
  {
    id: "project",
    label: "Project profile",
    href: "/app/projects",
    note: "Assignment, place, and optional link from this plan.",
  },
  {
    id: "stakeholders",
    label: "Stakeholders",
    href: "/app/stakeholders",
    note: "PAP / I&AP classes and named organisations seed the registry.",
  },
  {
    id: "engagements",
    label: "Engagement logs",
    href: "/app/engagements",
    note: "Imbizos, focus groups, and steering sessions with Capture templates.",
  },
  {
    id: "commitments",
    label: "Commitments",
    href: "/app/commitments",
    note: "Promises with owners. Local-content KPIs stay on Intelligence.",
  },
] as const;

export function SepSrmGraph() {
  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
      <h2 className="font-display text-lg font-semibold text-tl-ink">
        SRM trail this plan uses
      </h2>
      <p className="mt-1 text-sm text-tl-ink-muted">
        After approval, Apply writes the first three live desks (plus
        commitments). Grievances are not invented here — they open on Incidents
        when someone lodges a case.
      </p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-4">
        {NODES.map((node, index) => (
          <li
            key={node.id}
            className="rounded-md border border-tl-line px-3 py-3"
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-tl-trust">
              {index + 1}
            </p>
            <Link
              href={node.href}
              className="mt-1 block text-sm font-medium text-tl-trust-ink underline"
            >
              {node.label}
            </Link>
            <p className="mt-1 text-xs text-tl-ink-muted">{node.note}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Grievance desk:{" "}
        <Link href="/app/incidents" className="text-tl-trust-ink underline">
          Incidents
        </Link>{" "}
        — reported → resource deployed → investigated → resolved → verified →
        closed. Themba on public pages does not write the live case.
      </p>
    </section>
  );
}
