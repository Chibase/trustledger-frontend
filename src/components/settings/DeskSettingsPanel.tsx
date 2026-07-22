"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import type { UserRole } from "@/types/rbac";
import {
  DESK_TIERS,
  DESK_TIER_LABELS,
  VISIBILITY_FLAG_CAPABILITY,
  VISIBILITY_FLAG_LABELS,
  type DeskTier,
  type VisibilityFlag,
  type VisibilityMatrix,
} from "@/types/deskTier";
import {
  readDeskTier,
  readVisibilityMatrix,
  writeDeskTier,
  writeVisibilityMatrix,
  isDeskTierLocked,
} from "@/lib/deskVisibility";
import {
  canOwnerToggleCapability,
  hasCapabilityForPlan,
  upgradeHrefForCapability,
  upgradeLabelForCapability,
} from "@/lib/entitlements";
import { useToast } from "@/components/ui/Toast";

const FLAGS = Object.keys(VISIBILITY_FLAG_LABELS) as VisibilityFlag[];

type DeskSettingsPanelProps = {
  role: UserRole;
  canEditMatrix: boolean;
  /** When true (invitee), desk tier is Owner-assigned and not editable. */
  deskTierLocked?: boolean;
  /** Commercial plan — greys out visibility rows not on this plan. */
  planId?: PlanId | null;
};

export function DeskSettingsPanel({
  role,
  canEditMatrix,
  deskTierLocked = false,
  planId,
}: DeskSettingsPanelProps) {
  const { pushToast } = useToast();
  const [tier, setTier] = useState<DeskTier>("clo");
  const [matrix, setMatrix] = useState<VisibilityMatrix | null>(null);
  const [locked, setLocked] = useState(deskTierLocked);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTier(readDeskTier(role));
      setMatrix(readVisibilityMatrix());
      setLocked(deskTierLocked || isDeskTierLocked());
    });
    return () => cancelAnimationFrame(frame);
  }, [role, deskTierLocked]);

  if (!matrix) {
    return (
      <p className="text-sm text-tl-ink-muted">Loading desk settings…</p>
    );
  }

  const planLabel = planId ? PLANS[planId].name : "Demo (Project lens)";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="font-semibold">My desk tier</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          {locked
            ? "Assigned by your Plan Owner. Desk exposure cannot be raised on this seat."
            : "Professional level for this session. Defaults from login role; change to preview another desk view."}
        </p>
        <select
          className="mt-3 w-full rounded-md border border-tl-line px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
          value={tier}
          disabled={locked}
          onChange={(e) => {
            if (locked) return;
            const next = e.target.value as DeskTier;
            setTier(next);
            writeDeskTier(next);
            pushToast(`Desk set to ${DESK_TIER_LABELS[next]}`, "success");
          }}
        >
          {DESK_TIERS.map((id) => (
            <option key={id} value={id}>
              {DESK_TIER_LABELS[id]}
            </option>
          ))}
        </select>
        {locked ? (
          <p className="mt-2 text-xs text-tl-ink-muted">
            Locked · {DESK_TIER_LABELS[tier]}
          </p>
        ) : null}
      </section>

      {canEditMatrix ? (
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
          <h2 className="font-semibold">Visibility by desk tier</h2>
          <p className="mt-1 text-xs text-tl-ink-muted">
            Administrator control — who sees graphs, CRM detail, budget, and the
            supervisor queue. Rows greyed out are not on {planLabel}; upgrade to
            unlock them.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-tl-line text-tl-ink-muted">
                  <th className="py-2 pr-2 font-medium">Capability</th>
                  {DESK_TIERS.map((id) => (
                    <th key={id} className="px-1 py-2 font-medium">
                      {DESK_TIER_LABELS[id].split(" / ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FLAGS.map((flag) => {
                  const capability = VISIBILITY_FLAG_CAPABILITY[flag];
                  const onPlan = hasCapabilityForPlan(capability, planId);
                  const editable =
                    onPlan && canOwnerToggleCapability(capability, planId);
                  return (
                    <tr
                      key={flag}
                      className={`border-b border-tl-line/70 ${
                        editable
                          ? ""
                          : "bg-tl-paper/80 text-tl-ink-muted opacity-60"
                      }`}
                    >
                      <td className="py-2 pr-2">
                        <span className={editable ? "text-tl-ink" : ""}>
                          {VISIBILITY_FLAG_LABELS[flag]}
                        </span>
                        {!editable ? (
                          <span className="mt-0.5 block text-[0.65rem] text-tl-amber">
                            Not on {planLabel} ·{" "}
                            <Link
                              href={upgradeHrefForCapability(capability)}
                              className="underline text-tl-trust-ink"
                            >
                              {upgradeLabelForCapability(capability)}
                            </Link>
                          </span>
                        ) : null}
                      </td>
                      {DESK_TIERS.map((id) => (
                        <td key={id} className="px-1 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={editable ? matrix[id][flag] : false}
                            disabled={!editable}
                            onChange={(e) => {
                              if (!editable) return;
                              const next = structuredClone(matrix);
                              next[id][flag] = e.target.checked;
                              setMatrix(next);
                              writeVisibilityMatrix(next);
                            }}
                            aria-label={`${VISIBILITY_FLAG_LABELS[flag]} for ${DESK_TIER_LABELS[id]}${editable ? "" : " (not on plan)"}`}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="mt-3 rounded-md border border-tl-line px-3 py-1.5 text-xs font-medium hover:bg-tl-paper"
            onClick={() => {
              pushToast("Visibility matrix saved in this browser", "success");
            }}
          >
            Confirm save
          </button>
        </section>
      ) : (
        <p className="text-xs text-tl-ink-muted">
          Visibility matrix is editable by admin. Your current desk sees what
          the administrator allows.
        </p>
      )}
    </div>
  );
}
