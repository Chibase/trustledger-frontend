import Link from "next/link";
import { hasCapability } from "@/lib/entitlements";
import type { PlanId } from "@/config/plans";

export type DashboardQuickAction = {
  href: string;
  label: string;
  icon: QuickActionIcon;
};

export type QuickActionIcon = "add" | "case" | "report" | "capture" | "people";

function Icon({ name }: { name: QuickActionIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-6 w-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "add":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "case":
      return (
        <svg {...common}>
          <path d="M4 7h16v12H4z" />
          <path d="M8 7V5h8v2" />
        </svg>
      );
    case "report":
      return (
        <svg {...common}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v5h5M9 13h6M9 17h4" />
        </svg>
      );
    case "capture":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M4 19c.5-3 2.5-5 5-5s4.5 2 5 5" />
          <circle cx="17" cy="9" r="2.2" />
        </svg>
      );
  }
}

const WASH: Record<QuickActionIcon, string> = {
  add: "bg-tl-trust/10 text-tl-trust-ink",
  case: "bg-tl-demo/10 text-tl-demo",
  report: "bg-tl-amber/10 text-tl-amber",
  capture: "bg-tl-paper text-tl-ink",
  people: "bg-tl-trust/10 text-tl-trust-ink",
};

type Props = {
  actions: DashboardQuickAction[];
  title?: string;
};

export function DashboardQuickActions({
  actions,
  title = "Quick actions",
}: Props) {
  if (!actions.length) return null;
  return (
    <section className="rounded-xl border border-tl-line bg-tl-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-tl-ink">{title}</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-xl border border-tl-line px-2 py-3 text-center hover:border-tl-trust/40 hover:bg-tl-paper"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${WASH[action.icon]}`}
              >
                <Icon name={action.icon} />
              </span>
              <span className="text-xs font-medium text-tl-ink">
                {action.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Plan-gated overview tiles. Never invent modules the desk cannot open. */
export function planOverviewQuickActions(
  planId: PlanId | null | undefined,
): DashboardQuickAction[] {
  const actions: DashboardQuickAction[] = [];
  if (hasCapability("projects", planId)) {
    actions.push({
      href: "/app/projects?new=1",
      label: "Add project",
      icon: "add",
    });
  }
  if (hasCapability("incidents", planId)) {
    actions.push({
      href: "/app/issues/report",
      label: "Log issue",
      icon: "case",
    });
  }
  if (hasCapability("governanceReports", planId)) {
    actions.push({
      href: "/app/reports",
      label: "Generate report",
      icon: "report",
    });
  }
  if (hasCapability("incidents", planId)) {
    actions.push({
      href: "/app/incidents",
      label: "Open cases",
      icon: "people",
    });
  } else if (hasCapability("captureHub", planId)) {
    actions.push({
      href: "/app/capture",
      label: "Capture",
      icon: "capture",
    });
  }
  return actions.slice(0, 4);
}
