import Link from "next/link";
import { DemoBanner } from "@/components/shell/DemoBanner";
import { DemoLeadGate } from "@/components/shell/DemoLeadGate";
import { AppNav } from "@/components/shell/AppNav";
import { MobileNav } from "@/components/shell/MobileNav";
import { ShellSignOut } from "@/components/shell/ShellSignOut";
import { SupportDrawer } from "@/components/shell/SupportDrawer";
import { ToastProvider } from "@/components/ui/Toast";
import type { UserRole } from "@/types/rbac";

type AppShellProps = {
  role: UserRole;
  userName: string;
  mode: "demo" | "live";
  children: React.ReactNode;
  showDemoBanner?: boolean;
  showLeadGate?: boolean;
};

export function AppShell({
  role,
  userName,
  mode,
  children,
  showDemoBanner = true,
  showLeadGate = true,
}: AppShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-full bg-tl-paper text-tl-ink">
        {showDemoBanner ? <DemoBanner /> : null}
        {showLeadGate ? <DemoLeadGate /> : null}
        <MobileNav role={role} userName={userName} mode={mode} />

        <div className="flex min-h-[calc(100vh-2.25rem)]">
          <aside className="sticky top-0 hidden h-[calc(100vh-2.25rem)] w-64 shrink-0 flex-col bg-tl-ink text-white md:flex">
            <div className="border-b border-white/10 px-5 py-5">
              <Link
                href="/app/dashboard"
                className="font-display text-xl font-semibold tracking-tight text-white"
              >
                TrustLedger
              </Link>
              <p className="mt-1 text-xs text-white/55">
                Resolution you can audit
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
                Workspace
              </p>
              <AppNav role={role} variant="ink" />
            </div>

            <div className="space-y-3 border-t border-white/10 px-4 py-4">
              <SupportDrawer
                userName={userName}
                role={role}
                mode={mode}
                variant="ink"
              />
              <div>
                <p className="truncate text-sm font-medium text-white">
                  {userName}
                </p>
                <p className="mt-0.5 text-xs capitalize text-white/55">
                  {role}
                  {mode === "live" ? " · live" : " · demo"}
                </p>
                <div className="mt-3">
                  <ShellSignOut variant="ink" />
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
