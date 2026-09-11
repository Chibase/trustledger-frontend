"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShellSignOut } from "@/components/shell/ShellSignOut";

type NavItem = {
  href: string;
  label: string;
  badge?: string;
};

const NAV_EXEC: NavItem[] = [
  { href: "/ops/executive", label: "Executive Command", badge: "Live" },
  { href: "/ops/executive#engagement-plans", label: "Engagement plan" },
];

const NAV_PRODUCT: NavItem[] = [
  { href: "/app/engagement-plan", label: "Engagement plan desk" },
  { href: "/app/dashboard", label: "Workspace overview" },
];

const NAV_CONTROL: NavItem[] = [
  { href: "/ops/finance", label: "Finance & payments" },
  { href: "/ops/issues", label: "Issues control & SLA" },
  { href: "/ops/ai", label: "AI governance" },
  { href: "/ops/marketing", label: "Marketing review" },
  { href: "/ops/staff", label: "Staff & access" },
];

const NAV_OPS: NavItem[] = [
  { href: "/ops", label: "Activity overview" },
  { href: "/ops/activity", label: "Client activity" },
  { href: "/ops/reports", label: "Governance reports" },
  { href: "/ops/accounts", label: "Accounts & provision" },
  { href: "/ops/readiness", label: "Delivery readiness" },
];

type OpsShellProps = {
  operatorName: string;
  operatorEmail: string;
  children: React.ReactNode;
};

export function OpsShell({
  operatorName,
  operatorEmail,
  children,
}: OpsShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-tl-paper text-tl-ink">
      {/* Premium TrustLedger Dark Sidebar (Desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-tl-ink text-white md:flex print:hidden">
        {/* Brand & Platform Header */}
        <div className="border-b border-white/10 px-5 py-5">
          <Link
            href="/ops/executive"
            className="group block"
            aria-label="TrustLedger Executive Platform"
          >
            <span className="font-display text-xl font-semibold tracking-tight text-white group-hover:text-white/90">
              TrustLedger
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-tl-trust">
              Platform Command Centre
            </span>
          </Link>
          <p className="mt-1.5 text-xs text-white/50">
            Resolution you can audit · C-suite
          </p>
        </div>

        {/* Founder Operator Card */}
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tl-trust opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tl-trust" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {operatorName || "Platform Founder"}
              </p>
              <p className="truncate text-[11px] text-white/55">
                {operatorEmail || "operator@trustledger.co.za"}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/70">
              Founder & Operator
            </span>
            <span className="text-[10px] text-tl-trust">Active</span>
          </div>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 text-sm">
          <OpsNavSection
            title="Executive & Strategy"
            items={NAV_EXEC}
            pathname={pathname}
          />
          <OpsNavSection
            title="Product Desks"
            items={NAV_PRODUCT}
            pathname={pathname}
          />
          <OpsNavSection
            title="Command Control"
            items={NAV_CONTROL}
            pathname={pathname}
          />
          <OpsNavSection
            title="Operations & Intake"
            items={NAV_OPS}
            pathname={pathname}
          />
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/45">TrustLedger Cloud</span>
            <ShellSignOut variant="ink" />
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-tl-ink px-4 py-3 text-white md:hidden print:hidden">
          <div>
            <Link href="/ops/executive" className="font-display text-lg font-semibold">
              TrustLedger
            </Link>
            <p className="text-[10px] uppercase tracking-wider text-tl-trust">
              Executive Ops
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-white/15 bg-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.12]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-tl-ink p-4 text-white md:hidden print:hidden">
            <div className="mb-4 pb-3 border-b border-white/10">
              <p className="text-xs font-semibold text-white">{operatorName}</p>
              <p className="text-xs text-white/60">{operatorEmail}</p>
            </div>
            <div className="space-y-4 text-sm">
              <OpsNavSection
                title="Executive & Strategy"
                items={NAV_EXEC}
                pathname={pathname}
                onSelect={() => setMobileMenuOpen(false)}
              />
              <OpsNavSection
                title="Product Desks"
                items={NAV_PRODUCT}
                pathname={pathname}
                onSelect={() => setMobileMenuOpen(false)}
              />
              <OpsNavSection
                title="Command Control"
                items={NAV_CONTROL}
                pathname={pathname}
                onSelect={() => setMobileMenuOpen(false)}
              />
              <OpsNavSection
                title="Operations"
                items={NAV_OPS}
                pathname={pathname}
                onSelect={() => setMobileMenuOpen(false)}
              />
            </div>
            <div className="mt-4 pt-3 border-t border-white/10">
              <ShellSignOut variant="ink" />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function OpsNavSection({
  title,
  items,
  pathname,
  onSelect,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onSelect?: () => void;
}) {
  return (
    <div>
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
        {title}
      </p>
      <nav className="mt-1.5 space-y-1">
        {items.map((item) => {
          const isAnchor = item.href.includes("#");
          const targetPath = item.href.split("#")[0];
          const isActive = !isAnchor && pathname === targetPath;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onSelect}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-tl-trust text-white shadow-sm"
                  : "text-white/75 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
