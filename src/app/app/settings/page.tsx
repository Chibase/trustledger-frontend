import { API_BASE_URL, getDataMode } from "@/config/api";
import { PLANS } from "@/config/plans";
import { TeamSeatsPanel } from "@/components/org/TeamSeatsPanel";
import { DeskSettingsPanel } from "@/components/settings/DeskSettingsPanel";
import { EntitlementsSettingsPanel } from "@/components/settings/EntitlementsSettingsPanel";
import { ReportPackAccessPanel } from "@/components/settings/ReportPackAccessPanel";
import { DataSpacePanel } from "@/components/org/DataSpacePanel";
import { SettingsPlanBanner } from "@/components/settings/SettingsPlanBanner";
import { SettingsUtmRow } from "@/components/shell/SettingsUtmRow";
import { getCurrentUser } from "@/lib/auth";
import {
  isPlatformOperatorIdentity,
  isPlatformOperatorLockPublic,
  isPlatformOperatorOnly,
} from "@/lib/platformOperator";
import { aiService } from "@/services/aiService";

export default async function AppSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const dataMode = getDataMode();
  const aiMock = aiService.isMockMode();
  const operatorOnly = isPlatformOperatorOnly();
  const isOperator =
    user.mode === "live" && isPlatformOperatorIdentity(user.email);
  const planName = user.trialPlan ? PLANS[user.trialPlan].name : null;
  const isPlanOwner =
    user.isPlanOwner === true ||
    (user.role === "admin" && (user.mode === "trial" || Boolean(user.orgId)));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          {isPlanOwner
            ? "Plan Owner — invite juniors, set desk privileges, and review modules on your plan."
            : "Your organisation membership and assigned desk for this TrustLedger workspace."}
        </p>
      </div>

      <SettingsPlanBanner
        planId={user.trialPlan}
        trial={user.trial}
        isPlanOwner={isPlanOwner}
      />

      {isPlanOwner ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-tl-ink">
              Team & privileges
            </h2>
            <p className="mt-1 text-sm text-tl-ink-muted">
              Invite lower-rank seats and control what each desk may see. Your
              commercial plan is fixed above — it does not change from this
              page.
            </p>
          </div>
          <TeamSeatsPanel
            isPlanOwner={isPlanOwner}
            userEmail={user.email}
            userName={user.name}
            planId={user.trialPlan}
          />
          <DeskSettingsPanel
            role={user.role}
            isPlanOwner={isPlanOwner}
            deskTierLocked={Boolean(user.deskTierLocked)}
            planId={user.trialPlan}
            assignedDeskTier={user.deskTier}
          />
          <ReportPackAccessPanel
            planId={user.trialPlan}
            isPlanOwner={isPlanOwner}
          />
          <DataSpacePanel isPlanOwner={isPlanOwner} />
        </section>
      ) : (
        <>
          <TeamSeatsPanel
            isPlanOwner={false}
            userEmail={user.email}
            userName={user.name}
            planId={user.trialPlan}
          />
          <DeskSettingsPanel
            role={user.role}
            isPlanOwner={false}
            deskTierLocked
            planId={user.trialPlan}
            assignedDeskTier={user.deskTier}
          />
        </>
      )}

      <EntitlementsSettingsPanel
        planId={user.trialPlan}
        isPlanOwner={isPlanOwner}
      />

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="font-semibold">Profile</h2>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Name</dt>
            <dd>{user.name}</dd>
          </div>
          {user.email ? (
            <div className="flex justify-between gap-4">
              <dt className="text-tl-ink-muted">Email</dt>
              <dd className="font-mono text-xs">{user.email}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Role</dt>
            <dd>{user.role}</dd>
          </div>
          {user.orgId ? (
            <div className="flex justify-between gap-4">
              <dt className="text-tl-ink-muted">Organisation</dt>
              <dd className="font-mono text-xs">{user.orgId}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Plan Owner</dt>
            <dd>{isPlanOwner ? "yes" : "no"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">User id</dt>
            <dd className="font-mono text-xs">{user.id}</dd>
          </div>
          {planName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-tl-ink-muted">Plan</dt>
              <dd>{planName}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="font-semibold">Access control</h2>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Platform Operator lockdown</dt>
            <dd>{operatorOnly ? "on" : "off"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">You are Platform Operator</dt>
            <dd>{isOperator ? "yes" : "no"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Public demo lock</dt>
            <dd>{isPlatformOperatorLockPublic() ? "on" : "off"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-tl-ink-muted">
          Live product access is limited to the Platform Operator until lockdown
          is lifted by Chibase Consulting / TrustLedger ops.
        </p>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="font-semibold">Runtime mode</h2>
        <dl className="mt-3 space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">Data mode</dt>
            <dd className="font-medium">{dataMode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">AI assist</dt>
            <dd>
              {aiMock ? "demo suggestions" : "TrustLedger Cloud AI"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-tl-ink-muted">API base</dt>
            <dd className="max-w-[14rem] truncate font-mono text-xs">
              {API_BASE_URL}
            </dd>
          </div>
          <SettingsUtmRow />
        </dl>
        <p className="mt-4 text-xs text-tl-ink-muted">
          Demo mode uses sample data. Live mode connects this app to TrustLedger
          Cloud at <code>https://app.trustledger.co.za</code>.
        </p>
      </section>
    </div>
  );
}
