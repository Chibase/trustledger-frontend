"use client";

import { useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import { useToast } from "@/components/ui/Toast";

type ProvisionOwnerPanelProps = {
  /** Server-known operator session */
  isOperator: boolean;
  defaultPlanId?: PlanId | null;
  defaultEmail?: string | null;
  defaultName?: string | null;
  defaultOrg?: string | null;
  orgId?: string | null;
};

/**
 * Ops / Settings helper — dry-run Customer + Owner User drafts (T5).
 * Live create requires FRAPPE_OWNER_ISSUANCE + operator session.
 */
export function ProvisionOwnerPanel({
  isOperator,
  defaultPlanId,
  defaultEmail,
  defaultName,
  defaultOrg,
  orgId,
}: ProvisionOwnerPanelProps) {
  const { pushToast } = useToast();
  const [organization, setOrganization] = useState(defaultOrg || "");
  const [ownerEmail, setOwnerEmail] = useState(defaultEmail || "");
  const [ownerName, setOwnerName] = useState(defaultName || "");
  const [planId, setPlanId] = useState<PlanId>(defaultPlanId || "practitioner");
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);

  if (!isOperator) return null;

  async function run(dryRun: boolean) {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/frappe/provision-owner", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          organization,
          ownerEmail,
          ownerName,
          planId,
          orgId: orgId || undefined,
          dryRun,
          hasCrmLead: true,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        checklist?: Array<{ id: string; label: string; done: boolean; note?: string }>;
        customer?: unknown;
        user?: unknown;
      };
      if (!res.ok) {
        pushToast(json.error || "Provision call failed", "error");
        setResult(JSON.stringify(json, null, 2));
        return;
      }
      pushToast(json.message || (dryRun ? "Draft ready" : "Created"), "success");
      setResult(JSON.stringify(json, null, 2));
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
      <h2 className="font-semibold text-tl-ink">Frappe Owner provision (T5)</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Platform Operator only. Builds Customer + Plan Owner User drafts for
        Cloud. Live create needs{" "}
        <code className="font-mono">FRAPPE_OWNER_ISSUANCE=1</code> and API keys.
        Keep ADR-013 lockdown ON for buyers until smoke login works. See{" "}
        <span className="font-mono">docs/FRAPPE_SOT.md</span>.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs">
          Organization
          <input
            className="mt-1 w-full rounded-md border border-tl-line px-2 py-1.5"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Plan
          <select
            className="mt-1 w-full rounded-md border border-tl-line px-2 py-1.5"
            value={planId}
            onChange={(e) => setPlanId(e.target.value as PlanId)}
          >
            {(Object.keys(PLANS) as PlanId[]).map((id) => (
              <option key={id} value={id}>
                {PLANS[id].name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Owner email
          <input
            className="mt-1 w-full rounded-md border border-tl-line px-2 py-1.5"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
        </label>
        <label className="text-xs">
          Owner name
          <input
            className="mt-1 w-full rounded-md border border-tl-line px-2 py-1.5"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(true)}
          className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
        >
          Dry-run draft
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(false)}
          className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Create on Cloud
        </button>
      </div>
      {result ? (
        <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-tl-line bg-tl-paper/50 p-3 font-mono text-[11px] text-tl-ink">
          {result}
        </pre>
      ) : null}
    </section>
  );
}
