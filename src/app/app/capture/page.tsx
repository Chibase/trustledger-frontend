"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { CaptureConnectivityBanner } from "@/components/capture/CaptureConnectivityBanner";
import {
  CaptureFieldNoteMeta,
  EMPTY_FIELD_META,
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
import {
  actionItemsFromMinutes,
  parseMeetingHeldOn,
} from "@/lib/arrangeFieldNotes";
import {
  applyLocalImpactToEmpowerment,
  applyLocalIntelToCommunityIntel,
} from "@/lib/dossierIntel";
import { parseLocalCommunityIntel } from "@/lib/parseLocalCommunityIntel";
import { isPlanId, type PlanId } from "@/config/plans";
import {
  createCaptureId,
  deriveIssueLogRollup,
  emptyStructured,
  isNarrativeCaptureSource,
  isPackCaptureSource,
  latestPackCapture,
  listCaptureRecords,
  PACK_CAPTURE_SOURCES,
  PACK_SOURCE_META,
  saveCaptureRecord,
  structuredToBody,
  type CaptureSource,
  type CaptureStructured,
  type PackCaptureSource,
} from "@/lib/captureStore";
import {
  computeEmpowermentSpent,
  empowermentBudgetFromDossier,
  empowermentSpendFromFacts,
  hasEmpowermentSpendLines,
  withEmpowermentSpend,
} from "@/lib/empowermentSpend";
import {
  dossierSummaryLines,
  hydrateDossierFromProject,
  persistProjectWithDossier,
} from "@/lib/projectDossier";
import { readTrialModeFromDocument } from "@/lib/trial";
import { ensureTrialSeedProject } from "@/lib/trialStore";
import {
  listWorkspaceIncidents,
  preferCloudProjectList,
} from "@/lib/workspaceData";
import { getActiveOrgId } from "@/lib/orgStore";
import {
  isBrowserOnline,
  isLikelyNetworkFailure,
  subscribeBrowserConnection,
  shouldRetryPendingOnHydrate,
} from "@/lib/connectivity";
import {
  applyEngagementToTrustLayer,
  clearFieldCaptureDraft,
  fieldDraftHasContent,
  readFieldCaptureDraft,
  saveFieldCaptureDraft,
  withPendingApplyIds,
  type FieldPendingApply,
} from "@/lib/trust";
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
import type {
  Engagement,
  EngagementKind,
  EngagementSource,
} from "@/types/engagement";
import type { Incident } from "@/types/incident";
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
    hint: "Paste or upload rough notes, arrange into Item / Description / Action / Date, or insert a blank form. Works in field meetings and when notes arrive later over low connectivity.",
  },
  {
    id: "attendance",
    label: "Attendance register",
    hint: "Paste or upload a rough name list, arrange into the register, or insert a blank form. Works for registers handed over after the meeting. Presence on a register is not consent.",
  },
  {
    id: "social_intel",
    label: "Local community intel",
    hint: "Upload ward surveys + project impact (labour, training, local procurement — count & ZAR) for LED / ESG / M&E. Maps beside Stats SA and rolls up for funders.",
  },
  {
    id: "pasted_report",
    label: "Pasted report",
    hint: "Any narrative report — brief + stakeholders.",
  },
];

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
        // Do not prefill spend from target — spend is captured when delivered.
      },
    };
  }
  if (pack === "project_profile") {
    const spent =
      targets?.empowermentSpentZar ??
      project.budgetSpent ??
      computeEmpowermentSpent(project.id);
    const envelope =
      empowermentBudgetFromDossier(project.dossier) ??
      (project.budgetTotal || undefined);
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
        budgetTotal: envelope,
        budgetSpent: spent || undefined,
        publicSummary: project.publicSummary || undefined,
        sector: project.dossier?.sector,
        siteDescription: project.dossier?.siteDescription,
      },
    };
  }
  if (pack === "budget") {
    const spent =
      targets?.empowermentSpentZar ??
      project.budgetSpent ??
      computeEmpowermentSpent(project.id);
    const envelope =
      empowermentBudgetFromDossier(project.dossier) ??
      project.dossier?.budget?.authorisedZar ??
      (project.budgetTotal || undefined);
    return {
      pack,
      data: {
        budgetTotalZar: envelope,
        spendToDateZar: spent || undefined,
        contingencyZar: project.dossier?.budget?.contingencyZar,
      },
    };
  }
  if (pack === "issue_log") {
    return base;
  }
  return base;
}

function placeFromMeta(meta: FieldNoteMeta): string | undefined {
  const place = meta.place.trim();
  if (!place || place === "__other") return undefined;
  return place;
}

function networkApplyToast(err: unknown): string {
  if (isLikelyNetworkFailure(err)) {
    return "No connection — kept on this device. The apply you confirmed will retry when you are back online.";
  }
  return err instanceof Error ? err.message : "Could not finish apply";
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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [online, setOnline] = useState(() => isBrowserOnline());
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [pendingApply, setPendingApply] = useState<FieldPendingApply | null>(
    null,
  );
  const deepLinkDone = useRef(false);
  const draftHydrated = useRef("");
  const skipDraftSave = useRef(false);
  const packBaseline = useRef("");
  const applyInFlight = useRef(false);
  const retryConfirmedApplyRef = useRef<() => void>(() => {});

  const narrative = isNarrativeCaptureSource(source);
  const packSource = isPackCaptureSource(source) ? source : null;
  const project = projects.find((p) => p.id === projectId);
  const dossierReady = Boolean(project && projectHasDossierBasics(project));
  const projectIncidents = incidents.filter((i) => i.projectId === projectId);
  const applyExtract = extract ?? pendingApply?.extract ?? null;

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
        const rows = preferCloudProjectList(seeded);
        setProjects(rows);
        setIncidents(listWorkspaceIncidents());
        const params =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : null;
        const fromQuery = params?.get("projectId") || "";
        const sourceQuery = params?.get("source") || "";
        const queryProjectOk =
          Boolean(fromQuery) && rows.some((r) => r.id === fromQuery);
        const preferredProject = queryProjectOk
          ? fromQuery
          : rows[0]?.id || "";
        setProjectId((prev) => prev || preferredProject);
        // Deep-link Capture source (narrative templates or report packs).
        if (
          sourceQuery &&
          (isPackCaptureSource(sourceQuery) ||
            isNarrativeCaptureSource(sourceQuery)) &&
          (!fromQuery || queryProjectOk)
        ) {
          setSource(sourceQuery);
        }
      })();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    return subscribeBrowserConnection((next) => {
      setOnline(next);
      if (next) retryConfirmedApplyRef.current();
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const orgId = getActiveOrgId() || "local";
    const key = `${orgId}::${projectId}::${source}`;
    if (draftHydrated.current === key) return;
    draftHydrated.current = key;
    skipDraftSave.current = true;
    let retryTimer = 0;
    const frame = requestAnimationFrame(() => {
      const draft = readFieldCaptureDraft(orgId, projectId, source);
      if (!draft) {
        setPendingApply(null);
        setDraftSavedAt(null);
        if (narrative) setFieldMeta(EMPTY_FIELD_META);
        return;
      }
      setPendingApply(draft.pendingApply ?? null);
      setDraftSavedAt(draft.updatedAt);
      if (draft.title) setTitle(draft.title);
      if (narrative) {
        setFieldMeta(draft.meta);
        if (draft.body) setBody(draft.body);
        if (draft.pendingApply?.extract) {
          setExtract(draft.pendingApply.extract);
          setStatus("ready");
        }
      } else if (draft.pack && isPackCaptureSource(source)) {
        packBaseline.current = JSON.stringify(draft.pack);
        setPackData(draft.pack);
      }
      if (shouldRetryPendingOnHydrate(isBrowserOnline(), Boolean(draft.pendingApply))) {
        retryTimer = window.setTimeout(() => retryConfirmedApplyRef.current(), 0);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [narrative, projectId, source]);

  useEffect(() => {
    if (!projectId) return;
    const orgId = getActiveOrgId() || "local";
    const handle = window.setTimeout(() => {
      const key = `${orgId}::${projectId}::${source}`;
      if (draftHydrated.current !== key) return;
      if (skipDraftSave.current) {
        skipDraftSave.current = false;
        return;
      }
      if (packSource && JSON.stringify(packData) === packBaseline.current) {
        return;
      }
      const existing = readFieldCaptureDraft(orgId, projectId, source);
      const pack = packSource ? packData : undefined;
      const snapshot = {
        orgId,
        projectId,
        source,
        title,
        body: narrative ? body : "",
        meta: narrative ? fieldMeta : EMPTY_FIELD_META,
        pack,
        pendingApply: existing?.pendingApply,
      };
      if (!fieldDraftHasContent(snapshot)) {
        return;
      }
      const saved = saveFieldCaptureDraft(snapshot);
      setDraftSavedAt(saved.updatedAt);
    }, 400);
    return () => window.clearTimeout(handle);
  }, [
    narrative,
    packSource,
    projectId,
    source,
    title,
    body,
    fieldMeta,
    packData,
  ]);

  // Deep-link once: ?projectId=&source=pack opens that report pack form.
  useEffect(() => {
    if (deepLinkDone.current) return;
    if (!isPackCaptureSource(source) || projects.length === 0) return;
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const sourceParam = params?.get("source");
    if (!sourceParam || !isPackCaptureSource(sourceParam)) return;
    const queryProject = params?.get("projectId") || "";
    if (queryProject) {
      const forProject = projects.find((p) => p.id === queryProject);
      if (!forProject || forProject.id !== projectId) return;
      deepLinkDone.current = true;
      hydratePackForm(source, forProject);
      return;
    }
    if (!projectId) return;
    const forProject = projects.find((p) => p.id === projectId);
    if (!forProject) return;
    deepLinkDone.current = true;
    hydratePackForm(source, forProject);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep link
  }, [projectId, source, projects]);

  function issueLogFromIncidents(
    forProject: Project,
    rows: Incident[],
  ): CaptureStructured {
    const scoped = rows.filter((i) => i.projectId === forProject.id);
    const open = scoped.filter(
      (i) => i.status === "Open" || i.status === "Investigating",
    );
    const escalated = scoped.filter(
      (i) => i.status === "Escalated" || i.escalationLevel !== "None",
    );
    const latest = latestPackCapture(forProject.id, "issue_log");
    const base =
      latest?.structured?.pack === "issue_log"
        ? latest.structured.data
        : {};
    const entries = Array.isArray(base.entries) ? base.entries : [];
    if (entries.some((e) => e.title?.trim())) {
      const rollup = deriveIssueLogRollup(entries);
      return {
        pack: "issue_log",
        data: {
          ...base,
          entries,
          casesLogged: rollup.casesLogged,
          casesOpen: rollup.casesOpen,
          casesClosed: rollup.casesClosed,
          casesEscalated: rollup.casesEscalated,
          topThemes: rollup.topThemes || base.topThemes,
          openCaseRefs: rollup.openCaseRefs || base.openCaseRefs,
        },
      };
    }
    return {
      pack: "issue_log",
      data: {
        ...base,
        entries: entries.length ? entries : undefined,
        // Legacy packs without pathways: desk snapshot for open / escalated.
        casesOpen: base.casesOpen ?? open.length,
        casesEscalated: base.casesEscalated ?? escalated.length,
        openCaseRefs:
          base.openCaseRefs ||
          open
            .slice(0, 8)
            .map((i) => i.id)
            .join(" · ") ||
          undefined,
        topThemes:
          base.topThemes ||
          [...new Set(scoped.map((i) => i.category).filter(Boolean))]
            .slice(0, 6)
            .join(", ") ||
          undefined,
      },
    };
  }

  function selectProject(nextId: string) {
    setProjectId(nextId);
    setFieldMeta(EMPTY_FIELD_META);
    setExtract(null);
    setBrief(null);
    setError(null);
    setStatus("idle");
    setBriefStatus("idle");
    const nextProject = projects.find((p) => p.id === nextId);
    if (packSource && nextProject) {
      hydratePackForm(packSource, nextProject);
    }
  }

  function hydratePackForm(pack: PackCaptureSource, forProject: Project) {
    skipDraftSave.current = true;
    const orgId = getActiveOrgId() || "local";
    const draft = readFieldCaptureDraft(orgId, forProject.id, pack);
    if (draft?.pack && draft.pack.pack === pack) {
      packBaseline.current = JSON.stringify(draft.pack);
      setPackData(draft.pack);
      setTitle(draft.title || `${PACK_SOURCE_META[pack].label} — period pack`);
      setPendingApply(draft.pendingApply ?? null);
      setDraftSavedAt(draft.updatedAt);
      return;
    }
    // Project profile SoT is the dossier; period packs SoT is the last capture.
    if (pack === "project_profile") {
      const next = structuredFromProject(pack, forProject);
      packBaseline.current = JSON.stringify(next);
      setPackData(next);
      setTitle(`${PACK_SOURCE_META[pack].label} — period pack`);
      return;
    }
    if (pack === "issue_log") {
      const next = issueLogFromIncidents(forProject, incidents);
      packBaseline.current = JSON.stringify(next);
      setPackData(next);
      const latest = latestPackCapture(forProject.id, pack);
      setTitle(
        latest?.title || `${PACK_SOURCE_META[pack].label} — period pack`,
      );
      return;
    }
    const latest = latestPackCapture(forProject.id, pack);
    if (latest?.structured?.pack === pack) {
      packBaseline.current = JSON.stringify(latest.structured);
      setPackData(latest.structured);
      setTitle(latest.title);
      return;
    }
    const next = structuredFromProject(pack, forProject);
    packBaseline.current = JSON.stringify(next);
    setPackData(next);
    setTitle(`${PACK_SOURCE_META[pack].label} — period pack`);
  }

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
      if (project) hydratePackForm(next, project);
      else {
        const empty = emptyStructured(next);
        packBaseline.current = JSON.stringify(empty);
        setPackData(empty);
        setTitle(`${PACK_SOURCE_META[next].label} — period pack`);
      }
    }
  }

  function composedBody(): string {
    const preamble = narrative ? fieldNoteMetaPreamble(fieldMeta) : "";
    return `${preamble}${body.trim()}`.trim();
  }

  async function applyEngagementTrustRows(engagement: Engagement) {
    const orgId = getActiveOrgId() || "local";
    try {
      await applyEngagementToTrustLayer({
        engagement,
        fieldMeta,
        orgId,
      });
    } catch {
      // Engagement is already saved; trust rows may remain local-only.
    }
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
    if (!isBrowserOnline()) {
      setError(
        "No connection — AI extract needs the network. Your notes stay drafted on this device.",
      );
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
      setError(
        isLikelyNetworkFailure(err)
          ? "No connection — AI extract needs the network. Your notes stay drafted on this device."
          : err instanceof Error
            ? err.message
            : "Extract failed",
      );
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
    if (!isBrowserOnline()) {
      pushToast(
        "No connection — AI brief needs the network. Your notes stay drafted on this device.",
        "error",
      );
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
    } catch (err) {
      setBrief(null);
      setBriefStatus("error");
      if (isLikelyNetworkFailure(err)) {
        pushToast(
          "No connection — AI brief needs the network. Your notes stay drafted on this device.",
          "error",
        );
      }
    }
  }

  async function runConfirmedNarrativeApply() {
    if (applyInFlight.current) return;
    const orgId = getActiveOrgId() || "local";
    const stored = projectId
      ? readFieldCaptureDraft(orgId, projectId, source)
      : null;
    const suggestion = extract ?? stored?.pendingApply?.extract ?? null;
    if (!suggestion || !narrative) return;
    if (!projectId || !project) {
      pushToast("Select a project first", "error");
      return;
    }
    applyInFlight.current = true;
    try {
      const pending = withPendingApplyIds(
        {
          confirmedAt:
            stored?.pendingApply?.confirmedAt || new Date().toISOString(),
          kind: "narrative",
          extract: suggestion,
          captureId: stored?.pendingApply?.captureId,
          engagementId: stored?.pendingApply?.engagementId,
          stakeholderIds: stored?.pendingApply?.stakeholderIds,
        },
        suggestion.stakeholders.length,
      );
      const stamped = saveFieldCaptureDraft({
        orgId,
        projectId,
        source,
        title,
        body,
        meta: fieldMeta,
        pendingApply: pending,
      });
      setPendingApply(pending);
      setDraftSavedAt(stamped.updatedAt);

      const ids = pending.stakeholderIds || [];
      const savedBody = composedBody();
      for (let i = 0; i < suggestion.stakeholders.length; i += 1) {
        const row = suggestion.stakeholders[i];
        const id = ids[i];
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
      }
      const captureId = pending.captureId || createCaptureId();
      const record = {
        id: captureId,
        source,
        title: title.trim() || suggestion.briefTitle,
        body: savedBody,
        projectId: project.id,
        projectName: project.name,
        createdAt: new Date().toISOString(),
        appliedStakeholderIds: ids,
      };
      saveCaptureRecord(record);

      const actionFromMinutes = actionItemsFromMinutes(savedBody);
      const actionItems = (
        actionFromMinutes.length
          ? actionFromMinutes
          : (brief?.recommendedActions ?? [])
      )
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, 8);
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
      const heldOn =
        fieldMeta.meetingHeldOn.trim() ||
        parseMeetingHeldOn(savedBody) ||
        new Date().toISOString().slice(0, 10);
      const summaryBits = [
        brief?.executiveSummary?.trim() ||
          savedBody.slice(0, 480) ||
          suggestion.briefTitle,
        fieldMeta.capturedAfterMeeting
          ? "Captured after the meeting (handover notes)."
          : null,
      ].filter(Boolean);
      const savedEngagement = await engagementService.save({
        id: pending.engagementId || createEngagementId(),
        title: record.title,
        kind,
        status: "held",
        heldOn,
        ward: metaPlace || project.ward || "",
        placeLabel: metaPlace || project.name,
        projectId: project.id,
        summary: summaryBits.join(" "),
        attendeesLabel:
          suggestion.stakeholders.map((s) => s.name).join(", ") ||
          "From capture apply",
        actionItems,
        stakeholderIds: ids,
        captureId,
        source: engagementSource,
        createdAt: new Date().toISOString(),
      });
      await applyEngagementTrustRows(savedEngagement);

      if (source === "social_intel") {
        const localRows = parseLocalCommunityIntel(savedBody);
        if (localRows.length) {
          const dossier = hydrateDossierFromProject(project);
          const communityIntel = applyLocalIntelToCommunityIntel(
            dossier.communityIntel,
            localRows,
            { captureId },
          );
          const empowermentTargets = applyLocalImpactToEmpowerment(
            dossier.empowermentTargets,
            localRows,
          );
          try {
            const next = await persistProjectWithDossier({
              ...project,
              dossier: {
                ...dossier,
                communityIntel,
                ...(empowermentTargets ? { empowermentTargets } : {}),
              },
            });
            setProjects((prev) =>
              prev.map((p) => (p.id === next.id ? next : p)),
            );
          } catch (e) {
            const hold: FieldPendingApply = { ...pending, cloudSync: true };
            saveFieldCaptureDraft({
              orgId,
              projectId,
              source,
              title,
              body,
              meta: fieldMeta,
              pendingApply: hold,
            });
            setPendingApply(hold);
            pushToast(networkApplyToast(e), "error");
            setRecent(listCaptureRecords());
            return;
          }
          const impact = localRows.filter(
            (r) => r.domain === "project_impact",
          ).length;
          if (!isBrowserOnline()) {
            const hold: FieldPendingApply = { ...pending, cloudSync: true };
            saveFieldCaptureDraft({
              orgId,
              projectId,
              source,
              title,
              body,
              meta: fieldMeta,
              pendingApply: hold,
            });
            setPendingApply(hold);
            pushToast(
              "Saved on this device. This browser will retry the apply you confirmed when you reconnect.",
              "success",
            );
            setRecent(listCaptureRecords());
            return;
          }
          clearFieldCaptureDraft(orgId, projectId, source);
          setPendingApply(null);
          pushToast(
            `${ids.length} stakeholder(s) · ${localRows.length} local intel row(s)${impact ? ` (${impact} project impact)` : ""} · LED/ESG/M&E`,
            "success",
          );
          setRecent(listCaptureRecords());
          return;
        }
      }

      if (!isBrowserOnline()) {
        const hold: FieldPendingApply = { ...pending, cloudSync: true };
        saveFieldCaptureDraft({
          orgId,
          projectId,
          source,
          title,
          body,
          meta: fieldMeta,
          pendingApply: hold,
        });
        setPendingApply(hold);
        pushToast(
          "Saved on this device. This browser will retry the apply you confirmed when you reconnect.",
          "success",
        );
        setRecent(listCaptureRecords());
        return;
      }

      clearFieldCaptureDraft(orgId, projectId, source);
      setPendingApply(null);
      setRecent(listCaptureRecords());
      pushToast(
        stored?.pendingApply?.cloudSync
          ? "Apply retried from this browser (same records — not a second apply)"
          : `${ids.length} stakeholder(s) applied · engagement saved`,
        "success",
      );
    } catch (e) {
      pushToast(networkApplyToast(e), "error");
    } finally {
      applyInFlight.current = false;
    }
  }

  function applyStakeholders() {
    if (!extract && !pendingApply?.extract) return;
    if (!narrative) return;
    if (!projectId || !project) {
      pushToast("Select a project first", "error");
      return;
    }
    requireEmailThen("save", () => {
      void runConfirmedNarrativeApply();
    });
  }

  async function syncProjectFromProfile(structured: CaptureStructured) {
    if (structured.pack !== "project_profile" || !project) return;
    const d = structured.data;
    const status = asProjectStatus(d.status);
    const baseDossier = hydrateDossierFromProject(project);
    const next = await persistProjectWithDossier({
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
      // Keep empowerment spent from rollup unless profile explicitly sets it.
      budgetSpent:
        typeof d.budgetSpent === "number" ? d.budgetSpent : project.budgetSpent,
      publicSummary:
        d.publicSummary?.trim() ||
        d.siteDescription?.trim() ||
        project.publicSummary,
      dossier: {
        ...baseDossier,
        funder: {
          ...baseDossier.funder,
          name: d.clientFunder?.trim() || baseDossier.funder?.name,
        },
        geo: {
          ...baseDossier.geo,
          wardName: d.ward?.trim() || baseDossier.geo?.wardName,
          municipalityName:
            d.municipality?.trim() || baseDossier.geo?.municipalityName,
        },
        empowermentTargets: {
          ...baseDossier.empowermentTargets,
          empowermentBudgetZar:
            typeof d.budgetTotal === "number"
              ? d.budgetTotal
              : baseDossier.empowermentTargets?.empowermentBudgetZar,
          empowermentSpentZar:
            typeof d.budgetSpent === "number"
              ? d.budgetSpent
              : baseDossier.empowermentTargets?.empowermentSpentZar,
        },
        // Keep CAPEX authorisedZar separate from empowerment envelope.
        budget: {
          ...baseDossier.budget,
        },
        dates: {
          ...baseDossier.dates,
          startDate: d.startDate?.trim() || baseDossier.dates?.startDate,
          targetEndDate:
            d.targetEndDate?.trim() || baseDossier.dates?.targetEndDate,
        },
        sector: d.sector?.trim() || baseDossier.sector,
        siteDescription:
          d.siteDescription?.trim() ||
          d.publicSummary?.trim() ||
          baseDossier.siteDescription,
      },
    });
    setProjects((rows) => rows.map((p) => (p.id === next.id ? next : p)));
  }

  /** Roll training + B-BBEE empowerment line items into Project.budgetSpent. */
  async function syncEmpowermentSpent(saved: CaptureStructured) {
    if (!project) return;
    if (
      saved.pack !== "employment" &&
      saved.pack !== "bbbee" &&
      saved.pack !== "budget"
    ) {
      return;
    }
    const bbbeeLatest = latestPackCapture(project.id, "bbbee");
    const empLatest = latestPackCapture(project.id, "employment");
    let bb =
      bbbeeLatest?.structured?.pack === "bbbee"
        ? bbbeeLatest.structured.data
        : null;
    let emp =
      empLatest?.structured?.pack === "employment"
        ? empLatest.structured.data
        : null;
    if (saved.pack === "bbbee") bb = saved.data;
    if (saved.pack === "employment") emp = saved.data;

    const rolled = empowermentSpendFromFacts({ bbbee: bb, employment: emp });
    const hasLines = hasEmpowermentSpendLines({ bbbee: bb, employment: emp });

    let spent: number | null = null;
    if (saved.pack === "budget") {
      // Budget pack may override or seed spent; prefer explicit figure.
      if (typeof saved.data.spendToDateZar === "number") {
        spent = saved.data.spendToDateZar;
      } else if (hasLines) {
        spent = rolled;
      }
    } else if (hasLines) {
      spent = rolled;
    }

    if (spent == null) return;

    const next = await persistProjectWithDossier(
      withEmpowermentSpend(project, spent),
    );
    setProjects((rows) => rows.map((p) => (p.id === next.id ? next : p)));

    if (packSource === "budget" || packSource === "project_profile") {
      setPackData((prev) => {
        if (prev.pack === "budget") {
          return {
            pack: "budget",
            data: { ...prev.data, spendToDateZar: spent },
          };
        }
        if (prev.pack === "project_profile") {
          return {
            pack: "project_profile",
            data: { ...prev.data, budgetSpent: spent },
          };
        }
        return prev;
      });
    }
  }

  async function runConfirmedPackSave() {
    if (!packSource || packData.pack !== packSource) {
      pushToast("Select a report pack first", "error");
      return;
    }
    if (!projectId || !project) {
      pushToast("Link a project — report packs are project-scoped", "error");
      return;
    }
    if (applyInFlight.current) return;
    applyInFlight.current = true;
    setPackSaving(true);
    const orgId = getActiveOrgId() || "local";
    try {
      const stored = readFieldCaptureDraft(orgId, projectId, source);
      let structured: CaptureStructured = packData;
      if (
        stored?.pendingApply?.kind === "pack" &&
        stored.pack?.pack === packSource &&
        (packData.pack !== packSource ||
          !fieldDraftHasContent({
            title: "",
            body: "",
            meta: EMPTY_FIELD_META,
            pack: packData,
          }))
      ) {
        structured = stored.pack;
      }
      if (structured.pack === "issue_log") {
        const entries = Array.isArray(structured.data.entries)
          ? structured.data.entries
          : [];
        const titled = entries.filter((e) => e.title?.trim());
        if (titled.length) {
          const rollup = deriveIssueLogRollup(entries);
          structured = {
            pack: "issue_log",
            data: {
              ...structured.data,
              entries,
              casesLogged: rollup.casesLogged,
              casesOpen: rollup.casesOpen,
              casesClosed: rollup.casesClosed,
              casesEscalated: rollup.casesEscalated,
              topThemes: rollup.topThemes || structured.data.topThemes,
              openCaseRefs: rollup.openCaseRefs || structured.data.openCaseRefs,
            },
          };
        } else {
          structured = {
            pack: "issue_log",
            data: { ...structured.data, entries },
          };
        }
        setPackData(structured);
      }
      const pending = withPendingApplyIds({
        confirmedAt:
          stored?.pendingApply?.confirmedAt || new Date().toISOString(),
        kind: "pack",
        cloudSync: stored?.pendingApply?.cloudSync,
        captureId: stored?.pendingApply?.captureId,
      });
      const bodyText = structuredToBody(structured);
      const meta = PACK_SOURCE_META[packSource];
      const pathwayNote =
        structured.pack === "issue_log" &&
        (structured.data.entries || []).filter((e) => e.title?.trim()).length
          ? ` · ${(structured.data.entries || []).filter((e) => e.title?.trim()).length} pathway(s)`
          : "";
      const record = {
        id: pending.captureId || createCaptureId(),
        source: packSource,
        title: title.trim() || `${meta.label} — ${project.name}`,
        body: bodyText,
        projectId: project.id,
        projectName: project.name,
        createdAt: new Date().toISOString(),
        structured,
      };
      saveCaptureRecord(record);
      const stamped = saveFieldCaptureDraft({
        orgId,
        projectId,
        source,
        title: record.title,
        body: bodyText,
        meta: EMPTY_FIELD_META,
        pack: structured,
        pendingApply: pending,
      });
      setPendingApply(pending);
      setDraftSavedAt(stamped.updatedAt);
      try {
        await syncProjectFromProfile(structured);
        await syncEmpowermentSpent(structured);
      } catch (e) {
        const hold: FieldPendingApply = { ...pending, cloudSync: true };
        saveFieldCaptureDraft({
          orgId,
          projectId,
          source,
          title: record.title,
          body: bodyText,
          meta: EMPTY_FIELD_META,
          pack: structured,
          pendingApply: hold,
        });
        setPendingApply(hold);
        pushToast(
          isLikelyNetworkFailure(e)
            ? "Pack saved on this device. Cloud project update will retry when you reconnect."
            : e instanceof Error
              ? e.message
              : "Could not save project on TrustLedger Cloud",
          "error",
        );
        setRecent(listCaptureRecords());
        return;
      }
      if (!isBrowserOnline()) {
        const hold: FieldPendingApply = { ...pending, cloudSync: true };
        saveFieldCaptureDraft({
          orgId,
          projectId,
          source,
          title: record.title,
          body: bodyText,
          meta: EMPTY_FIELD_META,
          pack: structured,
          pendingApply: hold,
        });
        setPendingApply(hold);
        pushToast(
          "Pack saved on this device. Cloud project update will retry when you reconnect.",
          "success",
        );
        setRecent(listCaptureRecords());
        setTitle(record.title);
        return;
      }
      clearFieldCaptureDraft(orgId, projectId, source);
      setPendingApply(null);
      setRecent(listCaptureRecords());
      setTitle(record.title);
      const spentNote =
        packSource === "employment" || packSource === "bbbee"
          ? ` · empowerment spent R${computeEmpowermentSpent(project.id).toLocaleString("en-ZA")}`
          : "";
      pushToast(
        stored?.pendingApply?.cloudSync
          ? "Pack save retried from this browser (same pack — not a second save)"
          : `${meta.label} saved — available to Reports for this project${pathwayNote}${spentNote}`,
        "success",
      );
    } catch (e) {
      pushToast(networkApplyToast(e), "error");
    } finally {
      setPackSaving(false);
      applyInFlight.current = false;
    }
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
      void runConfirmedPackSave();
    });
  }

  retryConfirmedApplyRef.current = () => {
    if (applyInFlight.current) return;
    const orgId = getActiveOrgId() || "local";
    if (!projectId) return;
    const draft = readFieldCaptureDraft(orgId, projectId, source);
    if (!draft?.pendingApply) return;
    pushToast("Retrying the apply you already confirmed.", "success");
    if (draft.pendingApply.kind === "narrative") {
      void runConfirmedNarrativeApply();
    } else {
      void runConfirmedPackSave();
    }
  };

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

        <CaptureConnectivityBanner
          online={online}
          savedAt={draftSavedAt}
          pendingApply={Boolean(pendingApply)}
          pendingCloudSync={Boolean(pendingApply?.cloudSync)}
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
              onChange={(e) => selectProject(e.target.value)}
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
                this project and period. Issue log sits beside GRM. Employment
                training spend and B-BBEE packs auto-update empowerment spent.
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
              body={body}
              onInsert={(skeleton) => setBody(skeleton)}
              onBodyChange={setBody}
              onToast={(message, tone) =>
                pushToast(message, tone === "error" ? "error" : "success")
              }
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
                      placeholder={
                        fieldMeta.rapidCapture
                          ? "Notes-first: paste what was said. Dropdowns and extra context can wait."
                          : "Paste rough notes, upload .txt/.md/.csv/.pdf, or insert a blank form — then Arrange if needed…"
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AiAssistButton
                      label="Suggest stakeholders"
                      onClick={() => void runExtract()}
                      loading={status === "loading"}
                      disabled={!body.trim() || !online}
                    />
                    <AiAssistButton
                      label="Generate brief"
                      onClick={() => void runBrief()}
                      loading={briefStatus === "loading"}
                      disabled={!body.trim() || !online}
                    />
                  </div>
                  {!online ? (
                    <p className="text-xs text-tl-ink-muted">
                      AI extract and brief need a connection. Keep typing — the
                      draft stays in this browser until you apply.
                    </p>
                  ) : null}

                  <AiSuggestionPanel
                    title="Stakeholder suggestions"
                    status={
                      status === "loading"
                        ? "loading"
                        : applyExtract
                          ? "ready"
                          : status
                    }
                    error={error}
                    model={applyExtract?.model}
                    promptVersion={applyExtract?.promptVersion}
                    confidence={applyExtract?.confidence}
                    onApply={applyExtract ? applyStakeholders : undefined}
                    applyLabel="Apply to CRM"
                  >
                    {applyExtract ? (
                      <ul className="space-y-2 text-sm">
                        {applyExtract.stakeholders.map((s) => (
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
                    projectId={projectId}
                    projectIncidents={projectIncidents}
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
