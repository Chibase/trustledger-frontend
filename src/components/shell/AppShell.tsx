import Link from "next/link";
import { DemoBanner } from "@/components/shell/DemoBanner";
import { EmailCaptureGate } from "@/components/shell/EmailCaptureGate";
import { OperatorBanner } from "@/components/shell/OperatorBanner";
import { TrialBanner } from "@/components/shell/TrialBanner";
import { AppNav } from "@/components/shell/AppNav";
import { MobileNav } from "@/components/shell/MobileNav";
import { ShellSignOut } from "@/components/shell/ShellSignOut";
import { FeedbackDrawer } from "@/components/shell/FeedbackDrawer";
import { SupportDrawer } from "@/components/shell/SupportDrawer";
import { ToastProvider } from "@/components/ui/Toast";
import { PLANS, type PlanId } from "@/config/plans";
import {
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";
import type { TlMode } from "@/lib/auth.constants";
import type { TrialSnapshot } from "@/lib/trial";
import type { UserRole } from "@/types/rbac";

type AppShellProps = {
  role: UserRole;
  userName: string;
  userEmail?: string | null;
  mode: TlMode;
  children: React.ReactNode;
  showOperatorBanner?: boolean;
  trialPlan?: PlanId;
  trial?: TrialSnapshot;
  isGuest?: boolean;
};

export function AppShell({
  role,
  userName,
  userEmail,
  mode,
  children,
  showOperatorBanner = false,
  trialPlan,
  trial,
  isGuest = false,
}: AppShellProps) {
  const planLabel = trialPlan ? PLANS[trialPlan].name : null;
  const modeLabel =
    mode === "live" ? "live" : mode === "trial" ? "trial" : "demo";

  return (
    <ToastProvider>
      <div className="min-h-full bg-tl-paper text-tl-ink">
        {mode === "trial" && trial ? (
          <TrialBanner trial={trial} planId={trialPlan} email={userEmail} />
        ) : null}
        {mode === "demo" ? <DemoBanner planName={planLabel} /> : null}
        {showOperatorBanner ? <OperatorBanner /> : null}
        {mode === "demo" ? <EmailCaptureGate /> : null}
        <MobileNav
          role={role}
          userName={userName}
          mode={mode === "live" ? "live" : "demo"}
          isGuest={isGuest || mode === "trial"}
          planId={trialPlan}
        />

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
              <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-tl-trust">
                {PRODUCT_VERSION_LABEL}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
                Workspace
              </p>
              <AppNav role={role} variant="ink" planId={trialPlan} />
            </div>

            <div className="space-y-3 border-t border-white/10 px-4 py-4">
              <FeedbackDrawer variant="ink" />
              <SupportDrawer
                userName={userName}
                role={role}
                mode={mode === "live" ? "live" : "demo"}
                variant="ink"
              />
              <div>
                <p className="truncate text-sm font-medium text-white">
                  {userName}
                </p>
                <p className="mt-0.5 text-xs capitalize text-white/55">
                  {role}
                  {planLabel ? ` · ${planLabel}` : ""}
                  {` · ${modeLabel}`}
                  {showOperatorBanner ? " · operator" : ""}
                </p>
                <div className="mt-3">
                  <ShellSignOut
                    variant="ink"
                    isGuest={isGuest || mode === "trial"}
                  />
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
