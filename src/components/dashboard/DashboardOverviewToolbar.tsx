"use client";

import Link from "next/link";
import { hasCapability } from "@/lib/entitlements";
import type { PlanId } from "@/config/plans";
import type { CapabilityId } from "@/types/entitlements";

const LINKS: Array<{
  href: string;
  label: string;
  capability?: CapabilityId;
}> = [
  { href: "/app/projects", label: "Projects", capability: "projects" },
  { href: "/app/capture", label: "Capture", capability: "captureHub" },
  { href: "/app/reports", label: "Reports", capability: "governanceReports" },
  { href: "/app/incidents", label: "Cases", capability: "incidents" },
];

type Props = {
  planId?: PlanId | null;
  extra?: Array<{ href: string; label: string }>;
};

export function DashboardOverviewToolbar({
  planId = null,
  extra = [],
}: Props) {
  const links = [
    ...LINKS.filter(
      (link) => !link.capability || hasCapability(link.capability, planId),
    ),
    ...extra,
  ];
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
