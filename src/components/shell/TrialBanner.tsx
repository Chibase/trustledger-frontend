"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TrialSnapshot } from "@/lib/trial";
import { PLANS, type PlanId } from "@/config/plans";
import {
  markTrialBillingCancelled,
  readTrialBilling,
  type TrialBillingState,
} from "@/lib/trialBillingClient";

type TrialBannerProps = {
  trial: TrialSnapshot;
  planId?: PlanId;
  email?: string | null;
};

export function TrialBanner({ trial, planId, email }: TrialBannerProps) {
  const plan = planId ? PLANS[planId] : null;
  const [billing, setBilling] = useState<TrialBillingState | null>(null);
  const [optOutPending, setOptOutPending] = useState(false);
  const [optOutMessage, setOptOutMessage] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setBilling(readTrialBilling());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const scheduled = billing?.status === "scheduled";

  async function handleOptOut() {
    if (!email && !billing?.email) return;
    setOptOutPending(true);
    setOptOutMessage(null);
    try {
      const res = await fetch("/api/billing/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: billing?.email || email,
          name: billing?.name,
          organization: billing?.organization,
          planId: billing?.planId || planId,
          planLabel: billing?.planLabel || plan?.name,
          reference: billing?.reference,
          authorizationCode: billing?.authorizationCode,
        }),
      });
      const payload = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error || "Could not cancel billing");
      }
      const next = markTrialBillingCancelled();
      setBilling(next);
      setOptOutMessage("Billing cancelled — you will not be charged when the trial ends.");
    } catch (err) {
      setOptOutMessage(
        err instanceof Error ? err.message : "Could not cancel billing",
      );
    } finally {
      setOptOutPending(false);
    }
  }

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
          {trial.daysLeft} day{trial.daysLeft === 1 ? "" : "s"} left
          {scheduled ? " · card on file for end of trial" : null}
          {billing?.status === "cancelled" ? " · billing cancelled" : null}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {scheduled ? (
            <button
              type="button"
              disabled={optOutPending}
              onClick={handleOptOut}
              className="font-semibold underline underline-offset-2 hover:opacity-90 disabled:opacity-60"
            >
              {optOutPending ? "Cancelling…" : "Cancel before you are charged"}
            </button>
          ) : null}
          {!scheduled ? (
            <Link
              href={`/pay?plan=${plan?.id || "practitioner"}${email ? `&email=${encodeURIComponent(email)}` : ""}&utm_source=trial_banner&utm_medium=cta&utm_campaign=subscribe`}
              className="font-semibold underline underline-offset-2 hover:opacity-90"
            >
              Subscribe
            </Link>
          ) : null}
        </div>
      </div>
      {optOutMessage ? (
        <p className="border-t border-white/20 px-4 py-1.5 text-xs sm:px-6">
          {optOutMessage}
        </p>
      ) : null}
    </div>
  );
}
