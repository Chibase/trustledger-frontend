import Link from "next/link";
import { ShellSignOut } from "@/components/shell/ShellSignOut";

const NAV_EXEC = [{ href: "/ops/executive", label: "Executive Board" }];

const NAV_CONTROL = [
  { href: "/ops/finance", label: "Finance" },
  { href: "/ops/staff", label: "Staff" },
  { href: "/ops/ai", label: "AI tools" },
  { href: "/ops/issues", label: "Issues control" },
];

const NAV_OPS = [
  { href: "/ops", label: "Activity overview" },
  { href: "/ops/activity", label: "Client activity" },
  { href: "/ops/reports", label: "Reports" },
  { href: "/ops/accounts", label: "Accounts" },
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
  return (
    <div className="min-h-full bg-tl-paper text-tl-ink">
      <div className="border-b border-tl-ink bg-tl-ink text-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              TrustLedger Platform
            </p>
            <p className="text-xs text-white/55">
              Executive · command control · ops activity
            </p>
          </div>
          <div className="text-right text-xs text-white/70">
            <p className="font-medium text-white">{operatorName}</p>
            <p>{operatorEmail}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 md:px-8 print:max-w-none print:px-0 print:py-0">
        <aside className="hidden w-52 shrink-0 md:block print:hidden">
          <NavGroup title="C-suite" items={NAV_EXEC} emphasize />
          <NavGroup title="Command control" items={NAV_CONTROL} />
          <NavGroup title="Day-to-day ops" items={NAV_OPS} />
          <div className="mt-6 border-t border-tl-line pt-4">
            <ShellSignOut variant="light" />
          </div>
          <p className="mt-4 text-xs text-tl-ink-muted">
            Command control covers finance, staff, AI governance, and client
            issue TAT. Customer product work stays in{" "}
            <code className="text-tl-ink">/app</code>.
          </p>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
  emphasize = false,
}: {
  title: string;
  items: { href: string; label: string }[];
  emphasize?: boolean;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wide text-tl-ink-muted">
        {title}
      </p>
      <nav className="mt-1 space-y-1 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-2.5 py-2 text-tl-ink hover:bg-tl-surface ${
              emphasize ? "font-medium" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
