"use client";

import { useEffect, useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  allowedDesksForPack,
  defaultDesksForPack,
  readReportPackAccess,
  resetPackDeskAccess,
  setPackDeskAccess,
} from "@/lib/reportPackAccess";
import { useToast } from "@/components/ui/Toast";
import {
  DESK_TIERS,
  DESK_TIER_LABELS,
  type DeskTier,
  tierMeetsMinimum,
} from "@/types/deskTier";
import {
  REPORT_PACK_IDS,
  REPORT_PACKS,
  planIncludesPack,
} from "@/types/reportPacks";

type ReportPackAccessPanelProps = {
  planId?: PlanId | null;
  isPlanOwner: boolean;
};

/**
 * Plan Owner grants which desks may open each report pack.
 * Off-plan packs stay visible but locked (upgrade cue).
 */
export function ReportPackAccessPanel({
  planId,
  isPlanOwner,
}: ReportPackAccessPanelProps) {
  const { pushToast } = useToast();
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [planId, tick]);

  if (!isPlanOwner) return null;

  const planLabel = planId ? PLANS[planId].name : "Demo (Project lens)";

  function toggleDesk(packId: (typeof REPORT_PACK_IDS)[number], desk: DeskTier) {
    if (!planIncludesPack(planId, packId)) return;
    const min = REPORT_PACKS[packId].minDesk;
    if (!tierMeetsMinimum(desk, min)) return;
    const current = allowedDesksForPack(packId, planId);
    const next = current.includes(desk)
      ? current.filter((d) => d !== desk)
      : [...current, desk];
    setPackDeskAccess(packId, next, planId);
    setTick((n) => n + 1);
    pushToast(
      `${REPORT_PACKS[packId].shortLabel}: ${DESK_TIER_LABELS[desk]} ${
        next.includes(desk) ? "granted" : "revoked"
      }`,
      "success",
    );
  }

  function resetPack(packId: (typeof REPORT_PACK_IDS)[number]) {
    resetPackDeskAccess(packId);
    setTick((n) => n + 1);
    pushToast(`${REPORT_PACKS[packId].shortLabel} reset to plan defaults`, "success");
  }

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
      <h2 className="font-semibold">Report pack access</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Plan Owner only. Choose who may open Monthly, Executive, and Board
        packs. Plan ({planLabel}) sets which formats exist; you decide which
        desks may use them. Off-plan formats stay locked until upgrade.
      </p>

      {!ready ? (
        <p className="mt-3 text-xs text-tl-ink-muted">Loading pack access…</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {REPORT_PACK_IDS.map((packId) => {
            const def = REPORT_PACKS[packId];
            const onPlan = planIncludesPack(planId, packId);
            const allowed = allowedDesksForPack(packId, planId);
            const defaults = defaultDesksForPack(packId, planId);
            const customized = Object.prototype.hasOwnProperty.call(
              readReportPackAccess(),
              packId,
            );
            return (
              <li
                key={packId}
                className={`rounded-md border px-3 py-3 ${
                  onPlan
                    ? "border-tl-line bg-tl-paper/40"
                    : "border-tl-line/70 bg-tl-paper/20 opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-tl-ink">{def.label}</p>
                    <p className="text-xs text-tl-ink-muted">
                      {def.composition} · min desk {DESK_TIER_LABELS[def.minDesk]}
                      {!onPlan
                        ? ` · requires ${PLANS[def.minPlan].name}+`
                        : ""}
                    </p>
                  </div>
                  {onPlan && customized ? (
                    <button
                      type="button"
                      onClick={() => resetPack(packId)}
                      className="text-xs font-medium text-tl-trust-ink hover:underline"
                    >
                      Reset defaults
                    </button>
                  ) : null}
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {DESK_TIERS.map((desk) => {
                    const eligible = tierMeetsMinimum(desk, def.minDesk);
                    const checked = allowed.includes(desk);
                    const disabled = !onPlan || !eligible;
                    return (
                      <li key={desk}>
                        <label
                          className={`flex items-center gap-2 text-xs ${
                            disabled ? "cursor-not-allowed opacity-50" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={checked}
                            onChange={() => toggleDesk(packId, desk)}
                          />
                          <span>{DESK_TIER_LABELS[desk]}</span>
                          {!eligible && onPlan ? (
                            <span className="text-tl-ink-muted">(below pack)</span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {onPlan ? (
                  <p className="mt-2 text-[11px] text-tl-ink-muted">
                    Default desks:{" "}
                    {defaults.map((d) => DESK_TIER_LABELS[d]).join(", ") || "—"}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
