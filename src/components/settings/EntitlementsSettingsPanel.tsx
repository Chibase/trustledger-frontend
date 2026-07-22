"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  canOwnerToggleCapability,
  hasFullCapabilityControl,
  readCapabilityOverrides,
  resolveEntitlements,
  setCapabilityToggle,
  upgradeHrefForCapability,
  upgradeLabelForCapability,
} from "@/lib/entitlements";
import {
  CAPABILITIES,
  CAPABILITY_LABELS,
  type CapabilityId,
} from "@/types/entitlements";
import { useToast } from "@/components/ui/Toast";

type EntitlementsSettingsPanelProps = {
  planId?: PlanId | null;
  /** Plan Owner only — juniors must not receive this panel. */
  isPlanOwner: boolean;
};

export function EntitlementsSettingsPanel({
  planId,
  isPlanOwner,
}: EntitlementsSettingsPanelProps) {
  const { pushToast } = useToast();
  const [enabled, setEnabled] = useState<CapabilityId[]>([]);
  const [overrides, setOverrides] = useState<
    Partial<Record<CapabilityId, boolean>>
  >({});
  const [ready, setReady] = useState(false);

  function refresh() {
    setOverrides(readCapabilityOverrides());
    setEnabled([...resolveEntitlements(planId).capabilities]);
    setReady(true);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  if (!isPlanOwner) return null;

  const planLabel = planId ? PLANS[planId].name : "Demo (Project lens)";
  const fullControl = hasFullCapabilityControl(planId);

  function onToggle(id: CapabilityId, nextOn: boolean) {
    if (!canOwnerToggleCapability(id, planId)) return;
    const nextOverrides = setCapabilityToggle(id, nextOn, planId);
    setOverrides(nextOverrides);
    setEnabled([...resolveEntitlements(planId).capabilities]);
    pushToast(
      `${CAPABILITY_LABELS[id]} ${nextOn ? "on" : "off"}`,
      "success",
    );
  }

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
      <h2 className="font-semibold">Plan capabilities</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Plan Owner only. Your plan ({planLabel}) decides which modules you may
        switch on or off. Features above your plan stay visible so you can see
        what you are missing — they stay locked until you upgrade
        {fullControl ? "" : " (Institutional unlocks the full switchboard)"}.
      </p>

      {!ready ? (
        <p className="mt-3 text-xs text-tl-ink-muted">Loading capabilities…</p>
      ) : (
        <ul className="mt-4 divide-y divide-tl-line rounded-md border border-tl-line">
          {CAPABILITIES.map((id) => {
            const on = enabled.includes(id);
            const toggleable = canOwnerToggleCapability(id, planId);
            const forced = overrides[id];
            return (
              <li
                key={id}
                className={`flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 ${
                  toggleable
                    ? "bg-tl-surface"
                    : "bg-tl-paper/90 opacity-70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-medium ${
                      toggleable ? "text-tl-ink" : "text-tl-ink-muted"
                    }`}
                  >
                    {CAPABILITY_LABELS[id]}
                    {!toggleable ? (
                      <span className="ml-2 text-[0.65rem] font-normal uppercase tracking-wide text-tl-amber">
                        Locked
                      </span>
                    ) : null}
                  </p>
                  {toggleable ? (
                    <p className="mt-0.5 text-xs text-tl-ink-muted">
                      {typeof forced === "boolean"
                        ? forced
                          ? "Owner override · on"
                          : "Owner override · off"
                        : "Included on your plan"}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-tl-amber">
                      Not on {planLabel} · {upgradeLabelForCapability(id)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!toggleable ? (
                    <Link
                      href={upgradeHrefForCapability(id)}
                      className="text-xs font-medium text-tl-trust-ink underline"
                    >
                      Upgrade
                    </Link>
                  ) : null}
                  <label
                    className={`inline-flex items-center gap-2 text-xs ${
                      toggleable ? "" : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span className="sr-only">
                      {CAPABILITY_LABELS[id]}{" "}
                      {toggleable ? "toggle" : "(locked)"}
                    </span>
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!toggleable}
                      onChange={(e) => onToggle(id, e.target.checked)}
                      className="h-4 w-4 accent-tl-trust"
                    />
                    <span className="tabular-nums text-tl-ink-muted">
                      {on ? "On" : "Off"}
                    </span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!fullControl ? (
        <p className="mt-3 text-xs text-tl-ink-muted">
          Want every switch?{" "}
          <Link
            href="/pay?plan=institutional&utm_source=settings&utm_medium=entitlement&utm_campaign=upgrade_institutional"
            className="font-medium text-tl-trust-ink underline"
          >
            Upgrade to Institutional
          </Link>
          .
        </p>
      ) : (
        <p className="mt-3 text-xs text-tl-ink-muted">
          Institutional · full catalogue available to configure for this
          organisation.
        </p>
      )}
    </section>
  );
}
