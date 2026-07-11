"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/rbac";

export type NavItem = {
  href: string;
  label: string;
  roles?: UserRole[];
};

const NAV: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/projects", label: "Projects" },
  { href: "/app/incidents", label: "Incidents" },
  {
    href: "/app/issues/report",
    label: "Report issue",
    roles: ["community", "contractor", "admin"],
  },
  {
    href: "/app/reports",
    label: "Reports",
    roles: ["client", "admin"],
  },
  { href: "/app/settings", label: "Settings" },
];

type AppNavProps = {
  role: UserRole;
};

export function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();
  const items = NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <nav aria-label="App" className="space-y-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              active
                ? "bg-tl-trust text-white"
                : "text-tl-ink hover:bg-tl-paper"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
