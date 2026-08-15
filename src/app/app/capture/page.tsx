"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import {
  CaptureFieldNoteMeta,
  fieldNoteMetaPreamble,
  type FieldNoteMeta,
} from "@/components/capture/CaptureFieldNoteMeta";
import { CapturePackForm } from "@/components/capture/CapturePackForm";
import { CaptureTemplateBar } from "@/components/capture/CaptureTemplateBar";
import { ProjectDossierForm } from "@/components/projects/ProjectDossierForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import { TL_TRIAL_PLAN_COOKIE } from "@/lib/auth.constants";
import { isPlanId, type PlanId } from "@/config/plans";
import {
  createCaptureId,
  emptyStructured,
  isNarrativeCaptureSource,
  isPackCaptureSource,
  listCaptureRecords,
  PACK_CAPTURE_SOURCES,
  PACK_SOURCE_META,
  saveCaptureRecord,
  structuredToBody,
  type CaptureSource,
  type CaptureStructured,
  type PackCaptureSource,
} from "@/lib/captureStore";
import { dossierSummaryLines } from "@/lib/projectDossier";
import { saveOrgProject } from "@/lib/orgDataSpace";
import { readTrialModeFromDocument } from "@/lib/trial";
import { ensureTrialSeedProject, saveTrialProject } from "@/lib/trialStore";
import { listWorkspaceProjects } from "@/lib/workspaceData";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import { aiService } from "@/services/aiService";
import {
  createEngagementId,
  engagementService,
} from "@/services/engagementService";
import { projectService } from "@/services/projectService";
import { stakeholderService } from "@/services/stakeholderService";
import type {
  AiSuggestionStatus,
  ReportBriefSuggestion,
  StakeholderExtractSuggestion,
} from "@/types/ai";
import type { EngagementKind, EngagementSource } from "@/types/engagement";
import type { Project, ProjectStatus } from "@/types/project";
import {
  projectChipLabel,
  projectHasDossierBasics,
} from "@/types/project";
import type { Stakeholder, StakeholderKind } from "@/types/stakeholder";

const NARRATIVE_SOURCES: {
  id: CaptureSource;
  label: string;
  hint: string;
}[] = [
  {
    id: "minutes",
    label: "Meeting minutes",
    hint: "Insert the minutes template — labeled fields map attendees and actions.",
  },
  {
    id: "attendance",
    label: "Attendance register",
    hint: "Insert the register template — one named person per slot.",
  },
  {
    id: "social_intel",
    label: "Social intelligence",
    hint: "Insert the field-note template — people mentioned and themes.",
  },
  {
    id: "pasted_report",
    label: "Pasted report",
    hint: "Any narrative report — brief + stakeholders.",
  },
];

const EMPTY_FIELD_META: FieldNoteMeta = {
  purpose: "",
  kind: "",
  place: "",
  linkedPromiseId: "",
  concernTheme: "",
  severity: "",
};

function asKind(value: string): StakeholderKind {
  const allowed: StakeholderKind[] = [
    "individual",
    "organisation",
    "community_group",
    "traditional_authority",
    "government",
    "ngo",
    "contractor",
    "funder",
    "media",
    "union",
    "faith_based",
    "academic",
    "other",
  ];
  return allowed.includes(value as StakeholderKind)
    ? (value as StakeholderKind)
    : "individual";
}

function asProjectStatus(value: string | undefined): ProjectStatus | undefined {
  const allowed: ProjectStatus[] = [
    "Draft",
    "Approved",
    "Active",
    "OnHold",
    "Completed",
    "Closed",
  ];
  if (!value) return undefined;
  return allowed.includes(value as ProjectStatus)
    ? (value as ProjectStatus)
    : undefined;
}

function asEngagementKind(value: string | undefined): EngagementKind | null {
  const allowed: EngagementKind[] = [
    "meeting",
    "consultation",
    "walkabout",
    "briefing",
    "other",
  ];
  if (!value) return null;
  return allowed.includes(value as EngagementKind)
    ? (value as EngagementKind)
    : null;
}

/** Prefill pack targets from the project dossier when present. */
function structuredFromProject(
  pack: PackCaptureSource,
  project: Project | undefined,
): CaptureStructured {
  const base = emptyStructured(pack);
  if (!project) return base;
  const targets = project.dossier?.empowermentTargets;
  if (pack === "employment") {
    return {
      pack,
      data: {
        localHireTarget: targets?.localHireTarget,
        wardOfOriginNotes:
          project.dossier?.geo?.wardName || project.ward || undefined,
      },
    };
  }
  if (pack === "bbbee") {
    return {
      pack,
      data: {
        bbbeeLevel: targets?.bbbeeLevelTarget,
        blackOwnershipPct: targets?.blackOwnershipTargetPct,
        preferentialProcurementZar:
          targets?.preferentialProcurementTargetZar,
        skillsDevSpendZar: targets?.skillsDevTargetZar,
      },
    };
  }
  if (pack === "project_profile") {
    return {
      pack,
      data: {
        clientFunder:
          project.dossier?.funder?.name || project.clientFunder || undefined,
        contractorName: project.contractorName || undefined,
        ward: project.dossier?.geo?.wardName || project.ward || undefined,
        municipality:
          project.dossier?.geo?.municipalityName ||
          project.municipality ||
          undefined,
        status: project.status,
        startDate:
          project.dossier?.dates?.startDate || project.startDate || undefined,
        targetEndDate:
          project.dossier?.dates?.targetEndDate ||
          project.targetEndDate ||
          undefined,
        budgetTotal:
          project.dossier?.budget?.authorisedZar ??
          (project.budgetTotal || undefined),
        budgetSpent: project.budgetSpent || undefined,
        publicSummary: project.publicSummary || undefined,
        sector: project.dossier?.sector,
        siteDescription: project.dossier?.siteDescription,
      },
    };
  }
  if (pack === "budget") {
    return {
      pack,
      data: {
        budgetTotalZar:
          project.dossier?.budget?.authorisedZar ??
          (project.budgetTotal || undefined),
        spendToDateZar: project.budgetSpent || undefined,
        contingencyZar: project.dossier?.budget?.contingencyZar,
      },
    };
  }
  return base;
}

function placeFromMeta(meta: FieldNoteMeta): string | undefined {
  const place = meta.place.trim();
  if (!place || place === "__other") return undefined;
  return place;
}

export default function AppCapturePage() {
  const { pushToast } = useToast();
  const [source, setSource] = useState<CaptureSource>("minutes");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [fieldMeta, setFieldMeta] = useState<FieldNoteMeta>(EMPTY_FIELD_META);
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extract, setExtract] =
    useState<StakeholderExtractSuggestion | null>(null);
  const [brief, setBrief] = useState<ReportBriefSuggestion | null>(null);
  const [briefStatus, setBriefStatus] = useState<AiSuggestionStatus>("idle");
  const [recent, setRecent] = useState(listCaptureRecords());
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [packData, setPackData] = useState<CaptureStructured>(
    emptyStructured("project_profile"),
  );
  const [packSaving, setPackSaving] = useState(false);

  const narrative = isNarrativeCaptureSource(source);
  const packSource = isPackCaptureSource(source) ? source : null;
  const project = projects.find((p) => p.id === projectId);
  const dossierReady = Boolean(project && projectHasDossierBasics(project));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const match = document.cookie.match(
        new RegExp(`(?:^|; )${TL_TRIAL_PLAN_COOKIE}=([^;]*)`),
      );
      const raw = match?.[1] ? decodeURIComponent(match[1]) : "";
      setPlanId(isPlanId(raw) ? raw : null);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void (async () => {
        if (readTrialModeFromDocument()) ensureTrialSeedProject();
        const seeded = await projectService.list();
        if (cancelled) return;
        // listWorkspaceProjects merges dossiers; customer workspaces never get demo seed.
        const rows = listWorkspaceProjects(seeded);
        setProjects(rows);
        setProjectId((prev) => prev || rows[0]?.id || "");
      })();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setFieldMeta(EMPTY_FIELD_META);
  }, [projectId]);

  function selectSource(next: CaptureSource) {
    setSource(next);
    setExtract(null);
    setBrief(null);
    setError(null);
    setStatus("idle");
    setBriefStatus("idle");
    if (isNarrativeCaptureSource(next)) {
      setBody("");
    } else if (isPackCaptureSource(next)) {
      setPackData(structuredFromProject(next, project));
      setTitle((prev) => {
        const meta = PACK_SOURCE_META[next];
        return prev.trim() ? prev : `${meta.label} — period pack`;
      });
    }
  }

  function composedBody(): string {
    const preamble = narrative ? fieldNoteMetaPreamble(fieldMeta) : "";
    return `${preamble}${body.trim()}`.trim();
  }

  async function runExtract() {
    const text = composedBody();
    if (!text) {
      setError("Paste source text first.");
      setStatus("error");
      return;
    }
    if (!projectId || !project) {
      setError("Select a project first.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const result = await aiService.suggestStakeholdersFromText({
        text,
        source: source as
          | "minutes"
          | "attendance"
          | "social_intel"
          | "pasted_report",
        projectName: project.name,
      });
      setExtract(result);
      setStatus("ready");
    } catch (err) {
      setExtract(null);
      setError(err instanceof Error ? err.message : "Extract failed");
      setStatus("error");
    }
  }

  async function runBrief() {
    const text = composedBody();
    if (!text) {
      pushToast("Paste source text first", "error");
      return;
    }
    if (!projectId) {
      pushToast("Select a project first", "error");
      return;
    }
    setBriefStatus("loading");
    try {
      const result = await aiService.generateReportBrief({
        audience: "internal",
        projectId: projectId || undefined,
        sourceText: text,
        sourceLabel: NARRATIVE_SOURCES.find((s) => s.id === source)?.label,
      });
      setBrief(result);
      setBriefStatus("ready");
    } catch {
      setBrief(null);
      setBriefStatus("error");
    }
  }

  function applyStakeholders() {
    if (!extract || !narrative) return;
    if (!projectId || !project) {
      pushToast("Select a project first", "error");
      return;
    }
    requireEmailThen("save", () => {
      void (async () => {
        const ids: string[] = [];
        const savedBody = composedBody();
        for (const row of extract.stakeholders) {
          const id = `STK-C${Date.now().toString().slice(-5)}${ids.length}`;
          const stakeholder: Stakeholder = {
            id,
            name: row.name,
            kind: asKind(row.kind),
            status: "prospect",
            organisation: row.organisation,
            influence: row.influence,
            interests: [],
            tags: [source, "from-capture"],
            summary: row.rationale,
            projectIds: [projectId],
            source: "trial",
            countryCode: "ZA",
            createdAt: new Date().toISOString(),
          };
          await stakeholderService.save(stakeholder);
          ids.push(id);
        }
        const captureId = createCaptureId();
        const record = {
          id: captureId,
          source,
          title: title.trim() || extract.briefTitle,
          body: savedBody,
          projectId: project.id,
          projectName: project.name,
          createdAt: new Date().toISOString(),
          appliedStakeholderIds: ids,
        };
        saveCaptureRecord(record);

        const actionItems = (brief?.recommendedActions ?? [])
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 6);
        // Narrative-only: EngagementSource excludes pack sources.
        const engagementSource = source as EngagementSource;
        const metaPlace = placeFromMeta(fieldMeta);
        const kindFromMeta = asEngagementKind(fieldMeta.kind);
        const kind: EngagementKind =
          kindFromMeta ??
          (source === "attendance"
            ? "meeting"
            : source === "social_intel"
              ? "other"
              : source === "pasted_report"
                ? "briefing"
                : "consultation");
        await engagementService.save({
          id: createEngagementId(),
          title: record.title,
          kind,
          status: "held",
          heldOn: new Date().toISOString().slice(0, 10),
          ward: metaPlace || project.ward || "",
          placeLabel: metaPlace || project.name,
          projectId: project.id,
          summary:
            brief?.executiveSummary?.trim() ||
            savedBody.slice(0, 480) ||
            extract.briefTitle,
          attendeesLabel:
            extract.stakeholders.map((s) => s.name).join(", ") ||
            "From capture apply",
          actionItems,
          stakeholderIds: ids,
          captureId,
          source: engagementSource,
          createdAt: new Date().toISOString(),
        });

        setRecent(listCaptureRecords());
        pushToast(
          `${ids.length} stakeholder(s) applied · engagement saved`,
          "success",
        );
      })();
    });
  }

  function syncProjectFromProfile(structured: CaptureStructured) {
    if (structured.pack !== "project_profile" || !project) return;
    const d = structured.data;
    const status = asProjectStatus(d.status);
    const next: Project = {
      ...project,
      clientFunder: d.clientFunder?.trim() || project.clientFunder,
      contractorName: d.contractorName?.trim() || project.contractorName,
      ward: d.ward?.trim() || project.ward,
      municipality: d.municipality?.trim() || project.municipality,
      status: status || project.status,
      startDate: d.startDate?.trim() || project.startDate,
      targetEndDate: d.targetEndDate?.trim() || project.targetEndDate,
      budgetTotal:
        typeof d.budgetTotal === "number" ? d.budgetTotal : project.budgetTotal,
      budgetSpent:
        typeof d.budgetSpent === "number" ? d.budgetSpent : project.budgetSpent,
      publicSummary:
        d.publicSummary?.trim() ||
        d.siteDescription?.trim() ||
        project.publicSummary,
    };
    const trial = readTrialModeFromDocument();
    const customer = isCustomerWorkspaceClient();
    if (trial) saveTrialProject(next);
    else if (customer) saveOrgProject(next);
    setProjects((rows) => rows.map((p) => (p.id === next.id ? next : p)));
  }

  function savePack() {
    if (!packSource || packData.pack !== packSource) {
      pushToast("Select a report pack first", "error");
      return;
    }
    if (!projectId || !project) {
      pushToast("Link a project — report packs are project-scoped", "error");
      return;
    }
    requireEmailThen("save", () => {
      setPackSaving(true);
      try {
        const bodyText = structuredToBody(packData);
        const meta = PACK_SOURCE_META[packSource];
        const record = {
          id: createCaptureId(),
          source: packSource,
          title: title.trim() || `${meta.label} — ${project.name}`,
          body: bodyText,
          projectId: project.id,
          projectName: project.name,
          createdAt: new Date().toISOString(),
          structured: packData,
        };
        saveCaptureRecord(record);
        syncProjectFromProfile(packData);
        setRecent(listCaptureRecords());
        pushToast(
          `${meta.label} saved — available to Reports for this project`,
          "success",
        );
        setPackData(structuredFromProject(packSource, project));
        setTitle("");
      } finally {
        setPackSaving(false);
      }
    });
  }

  function handleDossierSaved(next: Project) {
    setProjects((rows) => rows.map((p) => (p.id === next.id ? next : p)));
    pushToast("Project details saved — field notes and packs unlocked", "success");
  }

  return (
    <FeatureGate
      capability="captureHub"
      planId={planId}
      lockedBody={
        <p className="mt-2 text-tl-ink-muted">
          Minutes, attendance, and field-note templates are still free on{" "}
          <Link href="/resources" className="text-tl-trust-ink underline">
            /resources
          </Link>
          . Project and Institutional plans include Capture hub so the desk
          maps labeled fields and report packs for ESG, B-BBEE, employment,
          CSI, GRM, and budget.
        </p>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Engagement + report capture"
          title="Capture hub"
          description="Start with the project once — funder, place, targets, promises. Then link field notes, issues, and period report packs without re-entering the heavy details."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/projects"
                className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                Projects
              </Link>
              <Link
                href="/app/reports"
                className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                Reports
              </Link>
              <Link
                href="/app/engagements"
                className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                Engagements
              </Link>
              <Link
                href="/app/stakeholders"
                className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                Stakeholders
              </Link>
            </div>
          }
        />

        <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="cap-project"
            >
              Project <span className="text-tl-ink-muted">(required first)</span>
            </label>
            <select
              id="cap-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              required
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {projectChipLabel(p)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-tl-ink-muted">
              No project yet?{" "}
              <Link href="/app/projects" className="text-tl-trust-ink underline">
                Add one under Projects
              </Link>
              .
            </p>
          </div>

          {project && !dossierReady ? (
            <div className="space-y-3">
              <p className="text-sm text-tl-ink-muted">
                Complete the project dossier once. Field notes and period packs
                stay locked until the basics are saved.
              </p>
              <ProjectDossierForm
                project={project}
                compact
                onSaved={handleDossierSaved}
              />
            </div>
          ) : null}

          {project && dossierReady ? (
            <div className="rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-xs text-tl-ink-muted">
              <p className="font-medium text-tl-ink">Using saved project details</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {dossierSummaryLines(project)
                  .slice(0, 6)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ul>
            </div>
          ) : null}

          {!projectId ? (
            <p className="text-sm text-tl-ink-muted">
              Select a project to unlock field notes and report packs.
            </p>
          ) : null}
        </section>

        {dossierReady && project ? (
          <>
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                Field notes
              </p>
              <div className="flex flex-wrap gap-2">
                {NARRATIVE_SOURCES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSource(s.id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      source === s.id
                        ? "bg-tl-trust text-white"
                        : "border border-tl-line bg-tl-surface hover:bg-tl-paper"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                Project report packs
              </p>
              <p className="text-sm text-tl-ink-muted">
                Structured inputs mapped to report kinds — fill each pack for
                this project and period. Employment and B-BBEE targets prefill
                from the dossier when available.
              </p>
              <div className="flex flex-wrap gap-2">
                {PACK_CAPTURE_SOURCES.map((id: PackCaptureSource) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectSource(id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      source === id
                        ? "bg-tl-trust text-white"
                        : "border border-tl-line bg-tl-surface hover:bg-tl-paper"
                    }`}
                  >
                    {PACK_SOURCE_META[id].label}
                  </button>
                ))}
              </div>
            </section>

            {narrative ? (
              <p className="text-sm text-tl-ink-muted">
                {NARRATIVE_SOURCES.find((s) => s.id === source)?.hint}
              </p>
            ) : null}

            <CaptureTemplateBar
              source={source}
              planId={planId}
              onInsert={(skeleton) => setBody(skeleton)}
            />

            <div className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4">
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="cap-title"
                >
                  Title
                </label>
                <input
                  id="cap-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  placeholder={
                    narrative
                      ? "e.g. Ward 12 consultation — 18 Jul"
                      : "e.g. August 2026 B-BBEE pack"
                  }
                />
              </div>

              {narrative ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runExtract();
                  }}
                >
                  <CaptureFieldNoteMeta
                    project={project}
                    meta={fieldMeta}
                    onChange={setFieldMeta}
                  />
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      htmlFor="cap-body"
                    >
                      Source text
                    </label>
                    <textarea
                      id="cap-body"
                      required
                      rows={8}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                      placeholder="Insert a blank template, or paste filled minutes / register text…"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AiAssistButton
                      label="Suggest stakeholders"
                      onClick={() => void runExtract()}
                      loading={status === "loading"}
                      disabled={!body.trim()}
                    />
                    <AiAssistButton
                      label="Generate brief"
                      onClick={() => void runBrief()}
                      loading={briefStatus === "loading"}
                      disabled={!body.trim()}
                    />
                  </div>

                  <AiSuggestionPanel
                    title="Stakeholder suggestions"
                    status={status}
                    error={error}
                    model={extract?.model}
                    promptVersion={extract?.promptVersion}
                    confidence={extract?.confidence}
                    onApply={extract ? applyStakeholders : undefined}
                    applyLabel="Apply to CRM"
                  >
                    {extract ? (
                      <ul className="space-y-2 text-sm">
                        {extract.stakeholders.map((s) => (
                          <li key={`${s.name}-${s.kind}`}>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-tl-ink-muted">
                              {" "}
                              · {s.kind.replaceAll("_", " ")} · {s.influence}
                            </span>
                            <p className="text-xs text-tl-ink-muted">
                              {s.rationale}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </AiSuggestionPanel>

                  <AiSuggestionPanel
                    title="AI brief from source"
                    status={briefStatus}
                    model={brief?.model}
                    promptVersion={brief?.promptVersion}
                  >
                    {brief ? (
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">{brief.title}</p>
                        <p>{brief.executiveSummary}</p>
                        <p className="font-medium">Risks</p>
                        <ul className="list-disc pl-5">
                          {brief.keyRisks.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        <p className="font-medium">Actions</p>
                        <ul className="list-disc pl-5">
                          {brief.recommendedActions.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </AiSuggestionPanel>
                </form>
              ) : packSource ? (
                <div className="space-y-4">
                  <CapturePackForm
                    pack={packSource}
                    value={packData}
                    onChange={setPackData}
                  />
                  <button
                    type="button"
                    onClick={savePack}
                    disabled={packSaving}
                    className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
                  >
                    {packSaving ? "Saving…" : "Save report pack"}
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="text-base font-semibold">Recent captures</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recent.slice(0, 10).map((r) => (
              <li
                key={r.id}
                className="border-b border-tl-line pb-2 last:border-0"
              >
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-tl-ink-muted">
                  {r.source.replaceAll("_", " ")}
                  {r.structured ? " · structured pack" : ""}
                  {r.projectName ? ` · ${r.projectName}` : ""}
                  {r.appliedStakeholderIds?.length
                    ? ` · ${r.appliedStakeholderIds.length} CRM applied`
                    : ""}
                </p>
              </li>
            ))}
            {recent.length === 0 ? (
              <li className="text-tl-ink-muted">
                No captures in this browser yet.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </FeatureGate>
  );
}
