"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SepDeskGate } from "@/components/sep/SepDeskContext";
import { SepDocumentView } from "@/components/sep/SepDocumentView";
import { SepExportActions } from "@/components/sep/SepExportActions";
import { SepProcessDashboard } from "@/components/sep/SepProcessDashboard";
import { SepSrmGraph } from "@/components/sep/SepSrmGraph";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { applyEngagementPlanToSrm, previewSepApply } from "@/lib/sepApply";
import { rebuildSepDocument } from "@/lib/sepComposer";
import { requestSepDocumentDraft } from "@/lib/sepDraftClient";
import { getEngagementPlan, saveEngagementPlan } from "@/lib/sepStore";
import { projectService } from "@/services/projectService";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_PROGRAMME_LABELS,
  SEP_SECTOR_LABELS,
  SEP_SOURCE_LABELS,
  SEP_STATUS_LABELS,
} from "@/types/engagementPlan";
import type { Project } from "@/types/project";

type Tab = "dashboard" | "document" | "apply";

export default function EngagementPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { pushToast } = useToast();
  const id = typeof params.id === "string" ? params.id : "";
  const [plan, setPlan] = useState<EngagementPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [applying, setApplying] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [place, setPlace] = useState("");
  const [client, setClient] = useState("");
  const [timeline, setTimeline] = useState("");

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (cancelled) return;
      const row = id ? getEngagementPlan(id) : null;
      const hydrated = row
        ? rebuildSepDocument(
            { ...row, timelineHint: row.timelineHint || "" },
            { touch: false },
          )
        : row;
      setPlan(hydrated);
      setProjectId(hydrated?.projectId || "");
      setPurpose(hydrated?.purposeStatement || "");
      setPlace(hydrated?.placeHint || "");
      setClient(hydrated?.clientFunderHint || "");
      setTimeline(hydrated?.timelineHint || "");
      setLoading(false);
      void projectService.list().then((rows) => {
        if (!cancelled) setProjects(rows);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [id]);

  function persist(
    next: EngagementPlan,
    opts?: { document?: "rebuild" | "keep" },
  ) {
    const rebuilt = rebuildSepDocument(next, {
      document:
        opts?.document ||
        (next.documentDrafter === "gemini" ? "keep" : "rebuild"),
    });
    const saved = saveEngagementPlan(rebuilt);
    setPlan(saved);
    return saved;
  }

  function saveMeta() {
    if (!plan) return;
    persist({
      ...plan,
      purposeStatement: purpose.trim() || plan.purposeStatement,
      placeHint: place.trim(),
      clientFunderHint: client.trim(),
      timelineHint: timeline.trim(),
      projectId: projectId || null,
      status: plan.status === "suggested" ? "saved" : plan.status,
    });
    pushToast("Plan updated.", "success");
  }

  async function redraft() {
    if (!plan) return;
    setDrafting(true);
    try {
      const ready = {
        ...plan,
        purposeStatement: purpose.trim() || plan.purposeStatement,
        placeHint: place.trim(),
        clientFunderHint: client.trim(),
        timelineHint: timeline.trim(),
        projectId: projectId || plan.projectId,
      };
      const { plan: drafted, synthesizer, error } = await requestSepDocumentDraft(
        ready,
        ready.sourceExcerpt || "",
      );
      persist(
        { ...drafted, status: drafted.status === "suggested" ? "saved" : drafted.status },
        { document: "keep" },
      );
      if (synthesizer === "gemini") {
        pushToast("Gemini redrafted the client document.", "success");
      } else if (drafted.documentDrafter === "gemini") {
        pushToast(
          error
            ? `${error} Existing Gemini document kept.`
            : "Gemini was unavailable. Existing document kept.",
          "info",
        );
      } else {
        pushToast(
          error
            ? `${error} Playbook template kept.`
            : "Playbook template used — Gemini was unavailable.",
          "info",
        );
      }
    } finally {
      setDrafting(false);
    }
  }

  async function apply() {
    if (!plan) return;
    setApplying(true);
    try {
      const ready = persist({
        ...plan,
        purposeStatement: purpose.trim() || plan.purposeStatement,
        placeHint: place.trim(),
        clientFunderHint: client.trim(),
        timelineHint: timeline.trim(),
        projectId: projectId || plan.projectId,
        status: plan.status === "suggested" ? "saved" : plan.status,
      });
      const result = await applyEngagementPlanToSrm(ready);
      setPlan(result.plan);
      pushToast(
        result.stakeholders + result.engagements + result.commitments === 0
          ? "Already applied — existing names and titles were skipped."
          : `Applied: ${result.stakeholders} stakeholders, ${result.engagements} engagements, ${result.commitments} commitments.`,
        "success",
      );
      setTab("dashboard");
    } catch {
      pushToast("Could not apply this plan. Try again from a signed-in desk.", "error");
    } finally {
      setApplying(false);
    }
  }

  const preview = plan ? previewSepApply(plan) : null;

  return (
    <SepDeskGate>
      <div className="space-y-6 print:space-y-0">
        <div className="print:hidden">
          <PageHeader
            eyebrow="Stakeholder Intelligence"
            title={loading ? "Loading…" : plan?.title || "Plan not found"}
            description={
              plan
                ? `${plan.programmeKind === "relocation" ? `${SEP_PROGRAMME_LABELS.relocation} · ` : ""}${SEP_SECTOR_LABELS[plan.sectorId]} · ${SEP_SOURCE_LABELS[plan.sourceKind]} · ${SEP_STATUS_LABELS[plan.status]}`
                : "Stakeholder engagement plan"
            }
            actions={
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/engagement-plan"
                  className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
                >
                  All plans
                </Link>
                {plan ? (
                  <SepExportActions
                    plan={plan}
                    onPrint={() => {
                      setTab("document");
                      window.setTimeout(() => window.print(), 120);
                    }}
                  />
                ) : null}
              </div>
            }
          />
        </div>

        {!loading && !plan ? (
          <p className="text-sm text-tl-ink-muted print:hidden">
            No engagement plan with id {id} in this workspace.{" "}
            <button
              type="button"
              className="text-tl-trust-ink underline"
              onClick={() => router.push("/app/engagement-plan")}
            >
              Back to list
            </button>
          </p>
        ) : null}

        {plan ? (
          <>
            <div
              role="tablist"
              className="flex flex-wrap gap-2 print:hidden"
            >
              {(
                [
                  ["dashboard", "Process dashboard"],
                  ["document", "Presentable document"],
                  ["apply", "Apply to SRM"],
                ] as const
              ).map(([idTab, label]) => (
                <button
                  key={idTab}
                  type="button"
                  role="tab"
                  aria-selected={tab === idTab}
                  onClick={() => setTab(idTab)}
                  className={
                    tab === idTab
                      ? "rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white"
                      : "rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "dashboard" ? (
              <div className="print:hidden">
                <SepProcessDashboard plan={plan} />
              </div>
            ) : null}

            {tab === "document" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                  <p className="text-sm text-tl-ink-muted">
                    {plan.documentDrafter === "gemini"
                      ? "Gemini drafted this document from the briefing. Edit facts, then re-draft if the assignment changed."
                      : "Playbook template. Re-draft with Gemini when you want bid-grade prose from the same facts."}
                  </p>
                  <button
                    type="button"
                    disabled={drafting}
                    onClick={() => void redraft()}
                    className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm font-medium hover:bg-tl-paper disabled:opacity-60"
                  >
                    {drafting ? "Drafting…" : "Re-draft with Gemini"}
                  </button>
                </div>
                <SepDocumentView plan={plan} />
              </div>
            ) : null}

            {tab === "apply" ? (
              <section className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4 print:hidden">
                <h2 className="font-display text-lg font-semibold text-tl-ink">
                  Streamline capture after approval
                </h2>
                <p className="text-sm text-tl-ink-muted">
                  Apply writes prospect stakeholders, draft engagements, and
                  open commitments on this workspace. Existing names and titles
                  are skipped. Capture templates stay on the engagement rows so
                  field teams log minutes instead of re-typing the plan. AI
                  never applies this step alone.
                </p>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Project</span>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full max-w-md rounded-md border border-tl-line px-3 py-2 text-sm"
                  >
                    <option value="">Unlinked (still applies to the desk)</option>
                    {projects.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Purpose (edit before apply)</span>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Place</span>
                    <input
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Client</span>
                    <input
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Timeline</span>
                    <input
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={saveMeta}
                  className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
                >
                  Save project, place & purpose
                </button>
                <SepSrmGraph />
                {preview ? (
                  <ul className="grid gap-3 sm:grid-cols-3">
                    <li className="rounded-md border border-tl-line px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
                        Stakeholders
                      </p>
                      <p className="font-display text-xl font-semibold">
                        {preview.stakeholders}
                      </p>
                      <Link
                        href="/app/stakeholders"
                        className="text-xs text-tl-trust-ink underline"
                      >
                        Registry
                      </Link>
                    </li>
                    <li className="rounded-md border border-tl-line px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
                        Draft engagements
                      </p>
                      <p className="font-display text-xl font-semibold">
                        {preview.engagements}
                      </p>
                      <Link
                        href="/app/engagements"
                        className="text-xs text-tl-trust-ink underline"
                      >
                        Engagements
                      </Link>
                    </li>
                    <li className="rounded-md border border-tl-line px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
                        Open commitments
                      </p>
                      <p className="font-display text-xl font-semibold">
                        {preview.commitments}
                      </p>
                      <Link
                        href="/app/commitments"
                        className="text-xs text-tl-trust-ink underline"
                      >
                        Commitments
                      </Link>
                    </li>
                  </ul>
                ) : null}
                {plan.applied ? (
                  <p className="text-sm text-tl-trust-ink">
                    Applied{" "}
                    {new Date(plan.applied.at).toLocaleString("en-ZA")}. Re-apply
                    skips duplicates.
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={applying}
                  onClick={() => void apply()}
                  className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
                >
                  {applying ? "Applying…" : "Apply suggestion to SRM"}
                </button>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </SepDeskGate>
  );
}
