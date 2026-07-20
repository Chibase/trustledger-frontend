import Link from "next/link";
import { DemoBanner } from "@/components/shell/DemoBanner";
import { EmailCaptureGate } from "@/components/shell/EmailCaptureGate";
import { AppNav } from "@/components/shell/AppNav";
import { MobileNav } from "@/components/shell/MobileNav";
import { ShellSignOut } from "@/components/shell/ShellSignOut";
import { ToastProvider } from "@/components/ui/Toast";
import { PLANS, type PlanId } from "@/config/plans";
import type { UserRole } from "@/types/rbac";

type AppShellProps = {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
  showDemoBanner?: boolean;
  trialPlan?: PlanId;
  isGuest?: boolean;
};

export function AppShell({
  role,
  userName,
  children,
  showDemoBanner = true,
  trialPlan,
  isGuest = false,
}: AppShellProps) {
  const planLabel = trialPlan ? PLANS[trialPlan].name : null;

  return (
    <ToastProvider>
      <div className="min-h-full bg-tl-paper text-tl-ink">
        {showDemoBanner ? (
          <DemoBanner planName={planLabel} />
        ) : null}
        <EmailCaptureGate />
        <MobileNav role={role} userName={userName} isGuest={isGuest} />

        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col md:flex-row">
          <aside className="hidden border-tl-line bg-tl-surface md:block md:w-56 md:shrink-0 md:border-r">
            <div className="px-4 py-4">
              <Link
                href="/app/dashboard"
                className="font-display text-lg font-semibold text-tl-ink"
              >
                TrustLedger
              </Link>
              <p className="mt-1 text-xs text-tl-ink-muted">
                {userName} · {role}
                {planLabel ? ` · ${planLabel}` : ""}
                {!showDemoBanner ? " · live" : ""}
              </p>
              <div className="mt-4">
                <ShellSignOut isGuest={isGuest} />
              </div>
            </div>
            <div className="px-2 pb-4">
              <AppNav role={role} />
            </div>
          </aside>

          <div className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
