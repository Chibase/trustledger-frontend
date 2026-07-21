import Link from "next/link";
import type { TrialSnapshot } from "@/lib/trial";
import { PLANS, type PlanId } from "@/config/plans";
import { formatPlanPrice, getPaystackPlans } from "@/lib/paystackPlans";

type TrialExpiredWallProps = {
  trial: TrialSnapshot;
  planId?: PlanId;
  email?: string | null;
  name?: string | null;
};

export function TrialExpiredWall({
  trial,
  planId,
  email,
  name,
}: TrialExpiredWallProps) {
  const plans = getPaystackPlans().filter((p) => p.selfServe);
  const retentionLabel = trial.retentionUntil.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const purged = trial.status === "purged";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">Trial ended</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        {purged ? "Trial data window closed" : "Upgrade to keep working"}
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        {purged
          ? "The 3-month retention window after your trial has ended. Start a new workspace or contact us if you need help."
          : `Your 14-day trial has ended and access is paused. Your data is retained until ${retentionLabel}. Upgrade now to restore access to the same workspace.`}
      </p>

      {!purged ? (
        <div className="mt-8 space-y-3">
          {plans.map((plan) => {
            const params = new URLSearchParams({
              plan: plan.id,
              utm_source: "trial_expired",
              utm_medium: "cta",
              utm_campaign: `upgrade_${plan.id}`,
            });
            if (email) params.set("email", email);
            if (name) params.set("name", name);
            const preferred = plan.id === planId;
            return (
              <Link
                key={plan.id}
                href={`/pay?${params.toString()}`}
                className={`block rounded-md px-4 py-3 ${
                  preferred
                    ? "bg-tl-trust text-white hover:bg-tl-trust-ink"
                    : "border border-tl-line bg-tl-surface hover:border-tl-trust/40"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">
                    {preferred ? "Continue with " : ""}
                    {plan.label}
                  </span>
                  <span className="text-sm tabular-nums opacity-90">
                    {formatPlanPrice(plan)}
                  </span>
                </span>
                <span
                  className={`mt-0.5 block text-sm ${
                    preferred ? "text-white/80" : "text-tl-ink-muted"
                  }`}
                >
                  {plan.summary}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/trial"
            className="rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Start a new trial
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-tl-line px-4 py-2.5 text-sm font-medium"
          >
            Contact us
          </Link>
        </div>
      )}

      {planId && PLANS[planId] ? (
        <p className="mt-6 text-xs text-tl-ink-muted">
          You were evaluating {PLANS[planId].name}.
        </p>
      ) : null}
    </main>
  );
}
