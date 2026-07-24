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

  async function ensureFields(dryRun: boolean) {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/frappe/ensure-custom-fields", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        pushToast(json.error || json.message || "Field ensure failed", "error");
        setResult(JSON.stringify(json, null, 2));
        return;
      }
      pushToast(json.message || "Fields checked", "success");
      setResult(JSON.stringify(json, null, 2));
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  async function setTempPassword() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/frappe/set-user-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: ownerEmail }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        temporaryPassword?: string;
      };
      if (!res.ok) {
        pushToast(json.error || "Could not set password", "error");
        setResult(JSON.stringify(json, null, 2));
        return;
      }
      pushToast(json.message || "Temporary password set", "success");
      setResult(JSON.stringify(json, null, 2));
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  async function ensureDocTypes(dryRun: boolean) {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/frappe/ensure-product-doctypes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        pushToast(json.error || json.message || "DocType ensure failed", "error");
        setResult(JSON.stringify(json, null, 2));
        return;
      }
      pushToast(json.message || "DocTypes checked", "success");
      setResult(JSON.stringify(json, null, 2));
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  async function smokeProduct() {
    setBusy(true);
    setResult("");
    try {
      const customer = organization.trim() || "Step1 Smoke Test";
      const projectId = `PRJ-SMOKE-${Date.now().toString(36).slice(-6)}`;
      const projectRes = await fetch("/api/frappe/product-smoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          kind: "project",
          customer,
          project: {
            id: projectId,
            name: "Step2 Smoke Project",
            clientFunder: customer,
            budgetTotal: 0,
            budgetSpent: 0,
            ward: "Ward 1",
            municipality: "Smoke Municipality",
            status: "Draft",
            contractorName: "",
            startDate: "",
            targetEndDate: "",
            publicSummary: "OD-2 smoke project",
          },
        }),
      });
      const projectJson = (await projectRes.json()) as {
        ok?: boolean;
        error?: string;
        name?: string;
      };
      if (!projectRes.ok || !projectJson.ok) {
        pushToast(projectJson.error || "Project smoke failed", "error");
        setResult(JSON.stringify(projectJson, null, 2));
        return;
      }

      const incidentId = `INC-SMOKE-${Date.now().toString(36).slice(-6)}`;
      const incidentRes = await fetch("/api/frappe/product-smoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          kind: "incident",
          customer,
          incident: {
            id: incidentId,
            title: "Step2 Smoke Incident",
            description: "OD-2 smoke case",
            ward: "Ward 1",
            geographicArea: "Smoke area",
            status: "Open",
            priority: "P3-Medium",
            projectId,
            projectName: "Step2 Smoke Project",
            reportedByRole: "admin",
            reporterName: ownerName || "Operator",
            reportedAt: new Date().toISOString(),
            slaDueBy: new Date().toISOString(),
            slaBreached: false,
            escalationLevel: "None",
            ownerName: ownerName || "Operator",
            category: "Smoke",
            impactScore: 0,
            sentimentScore: null,
            timeline: [],
          },
        }),
      });
      const incidentJson = (await incidentRes.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!incidentRes.ok || !incidentJson.ok) {
        pushToast(incidentJson.error || "Incident smoke failed", "error");
        setResult(
          JSON.stringify({ project: projectJson, incident: incidentJson }, null, 2),
        );
        return;
      }

      const evidenceRes = await fetch("/api/frappe/product-smoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          kind: "evidence",
          customer,
          evidence: {
            id: `EVD-SMOKE-${Date.now().toString(36).slice(-6)}`,
            incidentId,
            fileName: "smoke-note.txt",
            classification: "General",
            uploadedBy: ownerEmail || "operator",
            uploadedAt: new Date().toISOString(),
            isPrimary: true,
          },
        }),
      });
      const evidenceJson = (await evidenceRes.json()) as {
        ok?: boolean;
        error?: string;
      };
      const bundle = {
        project: projectJson,
        incident: incidentJson,
        evidence: evidenceJson,
      };
      if (!evidenceRes.ok || !evidenceJson.ok) {
        pushToast(evidenceJson.error || "Evidence smoke failed", "error");
        setResult(JSON.stringify(bundle, null, 2));
        return;
      }
      pushToast("Product smoke OK — Project + Incident + Evidence on Cloud", "success");
      setResult(JSON.stringify(bundle, null, 2));
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  async function smokeSi() {
    setBusy(true);
    setResult("");
    try {
      const customer = organization.trim() || "Step1 Smoke Test";
      const stkId = `STK-SMOKE-${Date.now().toString(36).slice(-6)}`;
      const engId = `ENG-SMOKE-${Date.now().toString(36).slice(-6)}`;
      const comId = `COM-SMOKE-${Date.now().toString(36).slice(-6)}`;

      const stkRes = await fetch("/api/frappe/product-smoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          kind: "stakeholder",
          customer,
          stakeholder: {
            id: stkId,
            name: "SI Smoke Stakeholder",
            kind: "community_group",
            status: "active",
            organisation: customer,
            countryCode: "ZA",
            influence: "medium",
            interests: ["water"],
            tags: ["smoke"],
            summary: "SI-Cloud smoke stakeholder",
            source: "live",
          },
        }),
      });
      const stkJson = (await stkRes.json()) as { ok?: boolean; error?: string };
      if (!stkRes.ok || !stkJson.ok) {
        pushToast(stkJson.error || "Stakeholder smoke failed", "error");
        setResult(JSON.stringify(stkJson, null, 2));
        return;
      }

      const engRes = await fetch("/api/frappe/product-smoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          kind: "engagement",
          customer,
          engagement: {
            id: engId,
            title: "SI Smoke Engagement",
            kind: "meeting",
            status: "held",
            heldOn: new Date().toISOString().slice(0, 10),
            ward: "Ward 1",
            projectId: null,
            summary: "SI-Cloud smoke engagement",
            attendeesLabel: "Smoke attendees",
            actionItems: ["Follow up on smoke commitment"],
            stakeholderIds: [stkId],
            source: "minutes",
            createdAt: new Date().toISOString(),
          },
        }),
      });
      const engJson = (await engRes.json()) as { ok?: boolean; error?: string };
      if (!engRes.ok || !engJson.ok) {
        pushToast(engJson.error || "Engagement smoke failed", "error");
        setResult(JSON.stringify({ stakeholder: stkJson, engagement: engJson }, null, 2));
        return;
      }

      const comRes = await fetch("/api/frappe/product-smoke", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          kind: "commitment",
          customer,
          commitment: {
            id: comId,
            title: "SI Smoke Commitment",
            status: "open",
            ownerLabel: ownerName || "Operator",
            dueOn: new Date().toISOString().slice(0, 10),
            projectId: null,
            engagementId: engId,
            stakeholderIds: [stkId],
            sourceActionItem: "Follow up on smoke commitment",
            createdAt: new Date().toISOString(),
          },
        }),
      });
      const comJson = (await comRes.json()) as { ok?: boolean; error?: string };
      const bundle = {
        stakeholder: stkJson,
        engagement: engJson,
        commitment: comJson,
      };
      if (!comRes.ok || !comJson.ok) {
        pushToast(comJson.error || "Commitment smoke failed", "error");
        setResult(JSON.stringify(bundle, null, 2));
        return;
      }
      pushToast(
        "SI smoke OK — Stakeholder + Engagement + Commitment on Cloud",
        "success",
      );
      setResult(JSON.stringify(bundle, null, 2));
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

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
          ensureFields: !dryRun,
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
      <h2 className="font-semibold text-tl-ink">Frappe Owner provision (Step 1)</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Platform Operator only. Ensures Desk custom fields, then builds Customer
        + Plan Owner User. Needs{" "}
        <code className="font-mono">FRAPPE_OWNER_ISSUANCE=1</code> and API keys.
        Keep ADR-013 lockdown ON until smoke login works. See{" "}
        <span className="font-mono">docs/OPERATIONAL_DELIVERY.md</span>.
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
          onClick={() => void ensureFields(true)}
          className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Check Desk fields
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void ensureFields(false)}
          className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Create Desk fields
        </button>
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
          className="rounded-md border border-tl-amber/50 bg-tl-amber/10 px-3 py-2 text-sm font-medium hover:bg-tl-amber/20 disabled:opacity-50"
        >
          Create on Cloud
        </button>
        <button
          type="button"
          disabled={busy || !ownerEmail.includes("@")}
          onClick={() => void setTempPassword()}
          className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Set temp password
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void ensureDocTypes(true)}
          className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Check product + SI DocTypes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void ensureDocTypes(false)}
          className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper disabled:opacity-50"
        >
          Create product + SI DocTypes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void smokeProduct()}
          className="rounded-md border border-tl-amber/50 bg-tl-amber/10 px-3 py-2 text-sm font-medium hover:bg-tl-amber/20 disabled:opacity-50"
        >
          Smoke Project→Incident→Evidence
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void smokeSi()}
          className="rounded-md border border-tl-amber/50 bg-tl-amber/10 px-3 py-2 text-sm font-medium hover:bg-tl-amber/20 disabled:opacity-50"
        >
          Smoke Stakeholder→Engagement→Commitment
        </button>
      </div>
      <p className="mt-2 text-xs text-tl-ink-muted">
        Step 2 / SI-Cloud: create DocTypes (including TL Stakeholder /
        Engagement / Commitment), then smoke rows under the Organization name as
        Frappe Customer. Forgot Owner password? Use{" "}
        <strong>Set temp password</strong>, or Forgot password on{" "}
        <code className="font-mono">/login/live</code>.
      </p>
      {result ? (
        <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-tl-line bg-tl-paper/50 p-3 font-mono text-[11px] text-tl-ink">
          {result}
        </pre>
      ) : null}
    </section>
  );
}
