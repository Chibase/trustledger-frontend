"use client";

import Link from "next/link";
import { OperatorBanner } from "@/components/shell/OperatorBanner";
import { TrialBanner } from "@/components/shell/TrialBanner";
import { VipShowcaseBanner } from "@/components/shell/VipShowcaseBanner";
import { SetupWizardGate } from "@/components/onboarding/SetupWizardGate";
import { TrialPasswordChangePrompt } from "@/components/shell/TrialPasswordChangePrompt";
import { SepDeskProvider } from "@/components/sep/SepDeskContext";
import { AppNav } from "@/components/shell/AppNav";
import { MobileNav } from "@/components/shell/MobileNav";
import { ShellSignOut } from "@/components/shell/ShellSignOut";
import { FeedbackDrawer } from "@/components/shell/FeedbackDrawer";
import { SupportDrawer } from "@/components/shell/SupportDrawer";
import { ToastProvider } from "@/components/ui/Toast";
import { EmailCaptureGate } from "@/components/shell/EmailCaptureGate";
import { SessionEmailBridge } from "@/components/shell/SessionEmailBridge";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import { packageLabel, isVipShowcaseWorkspace } from "@/lib/planLabel";
import { PlanDashboardAccessGate } from "@/components/shell/PlanDashboardAccessGate";
import { PlanModuleEmptyBanner } from "@/components/shell/PlanModuleEmptyBanner";
import { PlanModuleSwitcher } from "@/components/shell/PlanModuleSwitcher";
import { VipPackagingSync } from "@/components/shell/VipPackagingSync";
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
  isVip?: boolean;
  /** Operator / VIP desk only — not a commercial plan module. */
  sepDesk?: boolean;
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
  isVip = false,
  sepDesk = false,
}: AppShellProps) {
  const planLabel = packageLabel(trialPlan, { mode, vip: isVip });
  const modeLabel =
    mode === "live" ? "live" : mode === "trial" ? "trial" : "workspace";
  /** Plan Owners get the first-login wizard; juniors use Guide on demand. */
  const showSetupWizard = mode === "trial" || mode === "live";

  const vipShowcase = isVipShowcaseWorkspace(mode, isVip, userEmail);

  const shellBody = (
    <div className="min-h-full bg-tl-paper text-tl-ink">
      {vipShowcase ? <VipShowcaseBanner /> : null}
      <VipPackagingSync email={userEmail || ""} />
      {mode === "trial" && trial && !isVip ? (
        <TrialBanner trial={trial} planId={trialPlan} email={userEmail} />
      ) : null}
      {mode === "trial" && !isVip ? <TrialPasswordChangePrompt /> : null}
      {showOperatorBanner ? <OperatorBanner /> : null}
      <MobileNav
        role={role}
        userName={userName}
        mode={mode === "live" ? "live" : "demo"}
        isGuest={isGuest || mode === "trial"}
        planId={trialPlan}
        vip={isVip}
        appMode={mode}
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
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/40">
              Workspace
            </p>
            <AppNav
              role={role}
              variant="ink"
              planId={trialPlan}
              vip={isVip}
              mode={mode}
            />
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
            <PlanModuleSwitcher
              planId={trialPlan}
              vip={isVip}
              mode={mode}
              email={userEmail}
            />
            <PlanModuleEmptyBanner
              planId={trialPlan}
              vip={isVip}
              mode={mode}
              email={userEmail}
            />
            <PlanDashboardAccessGate
              planId={trialPlan}
              vip={isVip}
              mode={mode}
            >
              {children}
            </PlanDashboardAccessGate>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <SepDeskProvider allowed={sepDesk}>
        <SessionEmailBridge email={userEmail} />
        <EmailCaptureGate />
        {showSetupWizard ? (
          <SetupWizardGate
            planId={trialPlan}
            skipAutoOpen={vipShowcase}
            vip={isVip}
            mode={mode}
            email={userEmail}
          >
            {shellBody}
          </SetupWizardGate>
        ) : (
          shellBody
        )}
      </SepDeskProvider>
    </ToastProvider>
  );
}
