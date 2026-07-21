import Link from "next/link";
import type { TrialSnapshot } from "@/lib/trial";
import { PLANS, type PlanId } from "@/config/plans";

type TrialBannerProps = {
  trial: TrialSnapshot;
  planId?: PlanId;
  email?: string | null;
};

export function TrialBanner({ trial, planId, email }: TrialBannerProps) {
  const plan = planId ? PLANS[planId] : null;
  const upgradeHref = plan
    ? `/pay?plan=${plan.id}${email ? `&email=${encodeURIComponent(email)}` : ""}&utm_source=trial_banner&utm_medium=cta&utm_campaign=upgrade`
    : `/pay${email ? `?email=${encodeURIComponent(email)}&` : "?"}utm_source=trial_banner&utm_medium=cta&utm_campaign=upgrade`;

  return (
    <div className="animate-[tl-banner-in_280ms_ease-out] bg-tl-demo text-white">
      <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <p>
          <span className="font-semibold">14-day trial</span>
          {plan ? (
            <>
              <span className="mx-2 opacity-60">·</span>
              {plan.name}
            </>
          ) : null}
          <span className="mx-2 opacity-60">·</span>
          {trial.daysLeft} day{trial.daysLeft === 1 ? "" : "s"} left — your data
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={upgradeHref}
            className="font-semibold underline underline-offset-2 hover:opacity-90"
          >
            Upgrade &amp; pay
          </Link>
        </div>
      </div>
    </div>
  );
}
