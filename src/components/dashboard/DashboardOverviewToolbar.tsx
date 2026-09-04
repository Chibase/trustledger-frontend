import Link from "next/link";

const LINKS = [
  { href: "/app/projects", label: "Projects" },
  { href: "/app/capture", label: "Capture" },
  { href: "/app/reports", label: "Reports" },
  { href: "/app/incidents", label: "Cases" },
] as const;

type Props = {
  extra?: Array<{ href: string; label: string }>;
};

export function DashboardOverviewToolbar({ extra = [] }: Props) {
  const links = [...LINKS, ...extra];
  return (
    <nav
      aria-label="Workspace"
      className="flex flex-wrap gap-2"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
