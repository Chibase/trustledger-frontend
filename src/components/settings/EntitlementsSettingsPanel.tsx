"use client";

import { useEffect, useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  listEnabledAddons,
  readCapabilityOverrides,
  resolveEntitlements,
  writeCapabilityOverrides,
  writeEnabledAddons,
} from "@/lib/entitlements";
import {
  ADDON_GRANTS,
  ADDON_LABELS,
  CAPABILITIES,
  CAPABILITY_LABELS,
  type AddonId,
  type CapabilityId,
} from "@/types/entitlements";
import { useToast } from "@/components/ui/Toast";

type EntitlementsSettingsPanelProps = {
  planId?: PlanId | null;
  canEdit: boolean;
};

export function EntitlementsSettingsPanel({
  planId,
  canEdit,
}: EntitlementsSettingsPanelProps) {
  const { pushToast } = useToast();
  const [addons, setAddons] = useState<AddonId[]>([]);
  const [overrides, setOverrides] = useState<
    Partial<Record<CapabilityId, boolean>>
  >({});
  const [enabled, setEnabled] = useState<CapabilityId[]>([]);

  function refresh() {
    setAddons(listEnabledAddons());
    setOverrides(readCapabilityOverrides());
    setEnabled([...resolveEntitlements(planId).capabilities]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const planLabel = planId ? PLANS[planId].name : "Demo (Project lens)";

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
      <h2 className="font-semibold">Plan capabilities</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Commercial packaging = seats + function switches. Current lens:{" "}
        <span className="font-medium text-tl-ink">{planLabel}</span>. Pricing
        revisit later — this panel is the on/off switchboard for modules.
      </p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {CAPABILITIES.map((id) => {
          const on = enabled.includes(id);
          return (
            <li
              key={id}
              className={`rounded-md px-2 py-1 text-xs ${
                on
                  ? "bg-tl-trust/15 text-tl-trust-ink"
                  : "bg-tl-paper text-tl-ink-muted"
              }`}
            >
              {CAPABILITY_LABELS[id]}
              {on ? " · on" : " · off"}
            </li>
          );
        })}
      </ul>

      {canEdit ? (
        <div className="mt-5 space-y-4 border-t border-tl-line pt-4">
          <div>
            <h3 className="font-medium">Add-ons (preview)</h3>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Toggle packs that can be sold individually on top of a base plan.
            </p>
            <ul className="mt-2 space-y-2">
              {(Object.keys(ADDON_LABELS) as AddonId[]).map((id) => (
                <li key={id}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={addons.includes(id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...addons, id]
                          : addons.filter((a) => a !== id);
                        writeEnabledAddons(next);
                        setAddons(next);
                        setEnabled([
                          ...resolveEntitlements(planId).capabilities,
                        ]);
                      }}
                    />
                    <span>
                      <span className="font-medium">{ADDON_LABELS[id]}</span>
                      <span className="block text-xs text-tl-ink-muted">
                        Grants:{" "}
                        {ADDON_GRANTS[id]
                          .map((c) => CAPABILITY_LABELS[c])
                          .join(", ")}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Hard overrides</h3>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Force a capability on or off for this browser (ops preview).
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CAPABILITIES.map((id) => (
                <label key={id} className="flex items-center gap-2 text-xs">
                  <select
                    className="rounded border border-tl-line bg-tl-surface px-1 py-0.5"
                    value={
                      typeof overrides[id] === "boolean"
                        ? overrides[id]
                          ? "on"
                          : "off"
                        : "inherit"
                    }
                    onChange={(e) => {
                      const next = { ...overrides };
                      if (e.target.value === "inherit") delete next[id];
                      else next[id] = e.target.value === "on";
                      writeCapabilityOverrides(next);
                      setOverrides(next);
                      setEnabled([
                        ...resolveEntitlements(planId).capabilities,
                      ]);
                    }}
                  >
                    <option value="inherit">Inherit</option>
                    <option value="on">On</option>
                    <option value="off">Off</option>
                  </select>
                  {CAPABILITY_LABELS[id]}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-medium hover:bg-tl-paper"
            onClick={() => {
              refresh();
              pushToast("Entitlements refreshed", "success");
            }}
          >
            Refresh
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-tl-ink-muted">
          Admin can preview add-ons and overrides in Settings.
        </p>
      )}
    </section>
  );
}
