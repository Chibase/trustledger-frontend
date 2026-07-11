import Link from "next/link";
import { DemoBanner } from "@/components/shell/DemoBanner";
import { DemoLeadGate } from "@/components/shell/DemoLeadGate";
import { AppNav } from "@/components/shell/AppNav";
import { ShellSignOut } from "@/components/shell/ShellSignOut";
import type { UserRole } from "@/types/rbac";

type AppShellProps = {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
  showDemoBanner?: boolean;
};

export function AppShell({
  role,
  userName,
  children,
  showDemoBanner = true,
}: AppShellProps) {
  return (
    <div className="min-h-full bg-tl-paper text-tl-ink">
      {showDemoBanner ? <DemoBanner /> : null}
      <DemoLeadGate />

      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col md:flex-row">
        <aside className="border-b border-tl-line bg-tl-surface md:w-56 md:shrink-0 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-4 md:block">
            <Link
              href="/app/dashboard"
              className="font-display text-lg font-semibold text-tl-ink"
            >
              TrustLedger
            </Link>
            <p className="hidden text-xs text-tl-ink-muted md:mt-1 md:block">
              {userName} · {role}
            </p>
            <div className="md:mt-4">
              <ShellSignOut />
            </div>
          </div>
          <div className="px-2 pb-4">
            <AppNav role={role} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}
