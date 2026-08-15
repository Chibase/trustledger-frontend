"use client";

import Link from "next/link";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import { packageLabel } from "@/lib/planLabel";
import type { TrialSnapshot } from "@/lib/trial";

type SettingsPlanBannerProps = {
  planId?: PlanId | null;
  trial?: TrialSnapshot | null;
  isPlanOwner: boolean;
  mode?: TlMode | null;
  isVip?: boolean;
};

/**
 * Read-only commercial plan strip — clients never switch plan here.
 */
export function SettingsPlanBanner({
  planId,
  trial,
  isPlanOwner,
  mode = null,
  isVip = false,
}: SettingsPlanBannerProps) {
  const label = packageLabel(planId, { mode, vip: isVip });
  const daysLeft = trial?.status === "active" ? trial.daysLeft : null;
  const showUpgrade =
    Boolean(planId) && planId !== "institutional" && !isVip;

  return (
    <section className="rounded-lg border border-tl-trust/25 bg-tl-paper px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Your package
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-tl-ink">
            {label}
            {trial ? (
              <span className="ml-2 text-sm font-normal text-tl-ink-muted">
                · Trial
                {daysLeft !== null ? ` · ${daysLeft} days left` : ""}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-tl-ink-muted">
            {isVip
              ? "VIP complimentary package — Institutional desk. Plan changes only via TrustLedger ops."
              : isPlanOwner
                ? "Plan Owner — invite juniors and set desk privileges below. Plan changes only via Subscribe / upgrade."
                : "Assigned by your Plan Owner. You cannot change the organisation plan from Settings."}
          </p>
        </div>
        {showUpgrade ? (
          <Link
            href={`/pay?plan=${
              planId === "solo"
                ? "practitioner"
                : planId === "practitioner"
                  ? "project"
                  : "institutional"
            }&utm_source=settings&utm_medium=plan_banner&utm_campaign=upgrade`}
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-xs font-medium text-tl-trust-ink hover:bg-tl-paper"
          >
            Upgrade plan
          </Link>
        ) : null}
      </div>
    </section>
  );
}
