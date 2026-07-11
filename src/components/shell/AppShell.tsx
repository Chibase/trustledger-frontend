import Link from "next/link";
import { DemoBanner } from "@/components/shell/DemoBanner";
import { DemoLeadGate } from "@/components/shell/DemoLeadGate";
import { AppNav } from "@/components/shell/AppNav";
import { MobileNav } from "@/components/shell/MobileNav";
import { ShellSignOut } from "@/components/shell/ShellSignOut";
import { ToastProvider } from "@/components/ui/Toast";
import type { UserRole } from "@/types/rbac";

type AppShellProps = {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
  showDemoBanner?: boolean;
  showLeadGate?: boolean;
};

export function AppShell({
  role,
  userName,
  children,
  showDemoBanner = true,
  showLeadGate = true,
}: AppShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-full bg-tl-paper text-tl-ink">
        {showDemoBanner ? <DemoBanner /> : null}
        {showLeadGate ? <DemoLeadGate /> : null}
        <MobileNav role={role} userName={userName} />

        <div className="mx-auto flex min-h-[calc(100vh-2.25rem)] max-w-6xl md:min-h-[calc(100vh-2.25rem)]">
          <aside className="sticky top-0 hidden h-[calc(100vh-2.25rem)] w-60 shrink-0 flex-col border-r border-tl-line bg-tl-surface md:flex">
            <div className="border-b border-tl-line px-4 py-4">
              <Link
                href="/app/dashboard"
                className="font-display text-lg font-semibold tracking-tight text-tl-ink"
              >
                TrustLedger
              </Link>
              <p className="mt-1 text-xs text-tl-ink-muted">
                Resolution you can audit
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3">
              <p className="mb-2 px-2 text-[0.65rem] font-medium uppercase tracking-wider text-tl-ink-muted">
                Workspace
              </p>
              <AppNav role={role} />
            </div>

            <div className="border-t border-tl-line px-4 py-3">
              <p className="truncate text-sm font-medium text-tl-ink">
                {userName}
              </p>
              <p className="mt-0.5 text-xs capitalize text-tl-ink-muted">
                {role}
                {!showDemoBanner ? " · live" : " · demo"}
              </p>
              <div className="mt-2">
                <ShellSignOut />
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-7">
            {children}
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
