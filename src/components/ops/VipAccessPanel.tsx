"use client";

import { useMemo, useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import { useToast } from "@/components/ui/Toast";
import { siteBaseUrl } from "@/lib/hubspot";

type VipAccessPanelProps = {
  isOperator: boolean;
};

function defaultUntilDate(weeks = 8): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Ops — complimentary VIP pilots (full package, no Paystack / no /trial).
 * Isolated from paying and self-serve trial billing.
 */
export function VipAccessPanel({ isOperator }: VipAccessPanelProps) {
  const { pushToast } = useToast();
  const [organization, setOrganization] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [planId, setPlanId] = useState<PlanId>("institutional");
  const [until, setUntil] = useState(defaultUntilDate(8));
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastPasswordHint, setLastPasswordHint] = useState<string | null>(null);

  const loginUrl = useMemo(
    () => `${siteBaseUrl()}/login/live`,
    [],
  );

  if (!isOperator) return null;

  async function provisionVip(dryRun: boolean) {
    setBusy(true);
    setResult("");
    setLastPasswordHint(null);
    try {
      const res = await fetch("/api/frappe/provision-owner", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          organization: organization.trim() || undefined,
          ownerEmail,
          ownerName,
          planId,
          complimentaryVip: true,
          complimentaryUntil: until || undefined,
          dryRun,
          hasCrmLead: false,
          ensureFields: !dryRun,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        customerName?: string;
        skipped?: boolean;
      };
      if (!res.ok) {
        pushToast(json.error || json.message || "VIP provision failed", "error");
        setResult(JSON.stringify(json, null, 2));
        return;
      }
      pushToast(json.message || (dryRun ? "VIP draft ready" : "VIP created"), "success");
      setResult(JSON.stringify(json, null, 2));

      if (!dryRun && ownerEmail.includes("@")) {
        const pwdRes = await fetch("/api/frappe/set-user-password", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: ownerEmail.trim().toLowerCase() }),
        });
        const pwdJson = (await pwdRes.json()) as {
          error?: string;
          message?: string;
          temporaryPassword?: string;
        };
        if (pwdRes.ok && pwdJson.temporaryPassword) {
          setLastPasswordHint(pwdJson.temporaryPassword);
          pushToast("Temp password set — copy from the panel below", "success");
        } else if (!pwdRes.ok) {
          pushToast(
            pwdJson.error ||
              "VIP created but temp password failed — use Set temp password on Owner panel",
            "error",
          );
        }
      }
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-tl-trust/40 bg-tl-trust/5 p-4 text-sm">
      <h2 className="font-semibold text-tl-ink">VIP complimentary access</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Invite guests to the <strong>full package</strong> for a fixed period
        (default 8 weeks) without `/pay` or public `/trial`. Creates a separate{" "}
        <code className="font-mono text-[11px]">VIP Pilot — …</code> Customer
        with entitlement <strong>active</strong> and{" "}
        <strong>no Paystack authorization</strong> so day-14 charge-due never
        touches them. Paying and self-serve trial clients stay on their own
        paths.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Guest name</span>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
            placeholder="Thabo Molefe"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Work email</span>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
            placeholder="guest@organisation.co.za"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Organisation</span>
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
            placeholder="Acme Infrastructure"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Package</span>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value as PlanId)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
          >
            <option value="institutional">{PLANS.institutional.name} (full)</option>
            <option value="project">{PLANS.project.name}</option>
            <option value="practitioner">{PLANS.practitioner.name}</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Access until</span>
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm sm:max-w-xs"
          />
          <span className="mt-1 block text-xs text-tl-ink-muted">
            Stored on the Customer comment for your calendar. At end date, set
            entitlement to cancelled in Desk (or convert via /pay).
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !ownerEmail.includes("@") || ownerName.trim().length < 2}
          onClick={() => void provisionVip(true)}
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Dry-run VIP
        </button>
        <button
          type="button"
          disabled={busy || !ownerEmail.includes("@") || ownerName.trim().length < 2}
          onClick={() => void provisionVip(false)}
          className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
        >
          Create VIP access + temp password
        </button>
      </div>

      {lastPasswordHint ? (
        <div className="mt-4 rounded-md border border-tl-amber/40 bg-tl-amber/10 p-3 text-sm">
          <p className="font-semibold text-tl-ink">Send to guest</p>
          <p className="mt-1 text-tl-ink-muted">
            Sign in:{" "}
            <a href={loginUrl} className="font-medium text-tl-trust-ink underline">
              {loginUrl}
            </a>
          </p>
          <p className="mt-1">
            Email: <code className="font-mono text-xs">{ownerEmail.trim().toLowerCase()}</code>
          </p>
          <p className="mt-1">
            Temp password:{" "}
            <code className="font-mono text-xs">{lastPasswordHint}</code>
          </p>
          <p className="mt-2 text-xs text-tl-ink-muted">
            Ask them to change the password after first login. Complimentary
            until {until || "—"}.
          </p>
        </div>
      ) : null}

      {result ? (
        <pre className="mt-3 max-h-48 overflow-auto rounded-md border border-tl-line bg-tl-paper/50 p-3 font-mono text-[11px] text-tl-ink">
          {result}
        </pre>
      ) : null}
    </section>
  );
}
