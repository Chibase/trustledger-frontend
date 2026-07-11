"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/rbac";

export type NavItem = {
  href: string;
  label: string;
  roles?: UserRole[];
  icon: "dashboard" | "projects" | "incidents" | "report" | "reports" | "settings";
};

const NAV: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/app/projects", label: "Projects", icon: "projects" },
  { href: "/app/incidents", label: "Incidents", icon: "incidents" },
  {
    href: "/app/issues/report",
    label: "Report issue",
    roles: ["community", "contractor", "admin"],
    icon: "report",
  },
  {
    href: "/app/reports",
    label: "Reports",
    roles: ["client", "admin"],
    icon: "reports",
  },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ name }: { name: NavItem["icon"] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 4h7v7H4V4Zm9 0h7v5h-7V4ZM4 13h7v7H4v-7Zm9 3h7v4h-7v-4Z" />
        </svg>
      );
    case "projects":
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      );
    case "incidents":
      return (
        <svg {...common}>
          <path d="M12 3 3 19h18L12 3Z" />
          <path d="M12 9v5M12 16.5v.5" />
        </svg>
      );
    case "report":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "reports":
      return (
        <svg {...common}>
          <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M4.9 6.5l1.4 1.4M17.7 16.1l1.4 1.4M3 12h2M19 12h2M4.9 17.5l1.4-1.4M17.7 7.9l1.4-1.4" />
        </svg>
      );
  }
}

type AppNavProps = {
  role: UserRole;
};

export function AppNav({ role }: AppNavProps) {
  const pathname = usePathname();
  const items = NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <nav aria-label="App" className="space-y-0.5">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-tl-trust/10 text-tl-trust-ink ring-1 ring-inset ring-tl-trust/20"
                : "text-tl-ink-muted hover:bg-tl-paper hover:text-tl-ink"
            }`}
          >
            <span className={active ? "text-tl-trust" : "text-tl-ink-muted"}>
              <NavIcon name={item.icon} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
