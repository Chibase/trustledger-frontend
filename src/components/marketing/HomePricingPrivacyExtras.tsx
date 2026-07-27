"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  contactHrefForExtras,
  formatExtraFrom,
  PRIVACY_EXTRAS,
  type PrivacyExtraId,
} from "@/config/planComparison";

type HomePricingPrivacyExtrasProps = {
  /** Default plan lens for the contact CTA. */
  defaultPlanId?: PlanId;
};

/**
 * Optional privacy layers — client can tick what they want, then talk to sales.
 */
export function HomePricingPrivacyExtras({
  defaultPlanId = "project",
}: HomePricingPrivacyExtrasProps) {
  const [planId, setPlanId] = useState<PlanId>(defaultPlanId);
  const [selected, setSelected] = useState<PrivacyExtraId[]>(() =>
    PRIVACY_EXTRAS.filter((e) => e.defaultOn?.includes(defaultPlanId)).map(
      (e) => e.id,
    ),
  );

  const available = useMemo(
    () => PRIVACY_EXTRAS.filter((e) => e.availableOn.includes(planId)),
    [planId],
  );

  function toggle(id: PrivacyExtraId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onPlanChange(next: PlanId) {
    setPlanId(next);
    setSelected((prev) => {
      const kept = prev.filter((id) => {
        const extra = PRIVACY_EXTRAS.find((e) => e.id === id);
        return extra?.availableOn.includes(next);
      });
      const defaults = PRIVACY_EXTRAS.filter((e) =>
        e.defaultOn?.includes(next),
      ).map((e) => e.id);
      return [...new Set([...kept, ...defaults])];
    });
  }

  const href = contactHrefForExtras(
    planId,
    selected.filter((id) => available.some((e) => e.id === id)),
  );

  return (
    <div className="mt-12 border-t border-tl-line pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="font-display text-xl font-semibold text-tl-ink">
          Optional privacy layers
        </h3>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Choose extras for your {PLANS[planId].name} plan. Most privacy depth
          is optional — add only what your clients or funders require.
        </p>
      </div>

      <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">
        {(Object.keys(PLANS) as PlanId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPlanChange(id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              planId === id
                ? "bg-tl-trust text-white"
                : "border border-tl-line text-tl-ink hover:bg-tl-paper"
            }`}
          >
            {PLANS[id].name}
          </button>
        ))}
      </div>

      <ul className="mx-auto mt-6 max-w-3xl space-y-3">
        {available.length === 0 ? (
          <li className="rounded-md border border-dashed border-tl-line px-4 py-3 text-center text-sm text-tl-ink-muted">
            Privacy extras unlock from Practitioner upward. Solo keeps the
            included TrustLedger workspace protections.
          </li>
        ) : (
          available.map((extra) => {
            const on = selected.includes(extra.id);
            return (
              <li key={extra.id}>
                <label
                  className={`flex cursor-pointer gap-3 rounded-lg border px-4 py-3 ${
                    on
                      ? "border-tl-trust/40 bg-tl-trust/5"
                      : "border-tl-line bg-tl-paper"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(extra.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-tl-ink">{extra.name}</span>
                      <span className="text-xs tabular-nums text-tl-ink-muted">
                        {formatExtraFrom(extra.fromZar)}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-tl-ink-muted">
                      {extra.tagline}
                    </span>
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>

      <div className="mt-6 flex justify-center">
        <Link
          href={href}
          className="inline-flex rounded-md bg-tl-trust px-5 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          {selected.length
            ? "Request selected privacy options"
            : "Ask about privacy options"}
        </Link>
      </div>
    </div>
  );
}
