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
  /** Plan Owner may edit the privilege matrix for lower desks. */
  isPlanOwner: boolean;
  deskTierLocked?: boolean;
  planId?: PlanId | null;
  /** Server-known desk tier when cookies set it (invitee / Owner). */
  assignedDeskTier?: DeskTier | null;
};

/**
 * Desk assignment is read-only for everyone.
 * Plan Owner alone edits which lower desks see which modules (plan-gated).
 */
export function DeskSettingsPanel({
  role,
  isPlanOwner,
  deskTierLocked = false,
  planId,
  assignedDeskTier = null,
}: DeskSettingsPanelProps) {
  const { pushToast } = useToast();
  const [tier, setTier] = useState<DeskTier>("clo");
  const [matrix, setMatrix] = useState<VisibilityMatrix | null>(null);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const fromStorage = readDeskTier(role);
      setTier(assignedDeskTier || fromStorage);
      setMatrix(readVisibilityMatrix());
      setLocked(
        deskTierLocked ||
          isDeskTierLocked() ||
          !isPlanOwner ||
          Boolean(assignedDeskTier),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [role, deskTierLocked, isPlanOwner, assignedDeskTier]);

  if (!matrix) {
    return (
      <p className="text-sm text-tl-ink-muted">Loading desk settings…</p>
    );
  }

  const planLabel = planId ? PLANS[planId].name : "Demo (Project lens)";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="font-semibold">Your desk</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          {isPlanOwner
            ? "Plan Owner desk for this organisation. Juniors receive a desk when you invite them — they cannot raise exposure themselves."
            : "Assigned by your Plan Owner. Desk exposure is fixed for this seat."}
        </p>
        <p className="mt-3 rounded-md border border-tl-line bg-tl-paper px-3 py-2 font-medium text-tl-ink">
          {DESK_TIER_LABELS[tier]}
          {locked || !isPlanOwner ? (
            <span className="ml-2 text-xs font-normal text-tl-ink-muted">
              · locked
            </span>
          ) : null}
        </p>
      </section>

      {isPlanOwner ? (
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
          <h2 className="font-semibold">Desk privileges for lower ranks</h2>
          <p className="mt-1 text-xs text-tl-ink-muted">
            Set what each desk tier may see after you invite them (Settings →
            Team / Seats). Rows greyed out are not on {planLabel} — upgrade to
            unlock those privileges.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-tl-line text-tl-ink-muted">
                  <th className="py-2 pr-2 font-medium">Privilege</th>
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
                              className="text-tl-trust-ink underline"
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
              pushToast("Desk privileges saved in this browser", "success");
            }}
          >
            Confirm privileges
          </button>
        </section>
      ) : (
        <p className="text-xs text-tl-ink-muted">
          Desk privileges are set by your Plan Owner. Use Feedback if something
          looks wrong for your seat.
        </p>
      )}
    </div>
  );
}
