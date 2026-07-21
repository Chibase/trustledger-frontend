"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { GeoLocationWizard } from "@/components/geo/GeoLocationWizard";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import { useToast } from "@/components/ui/Toast";
import {
  createDemoIncidentId,
  createDemoProjectId,
  listDemoProjects,
  saveDemoIncident,
  saveDemoProject,
} from "@/lib/demoStore";
import { readDeskTier } from "@/lib/deskVisibility";
import {
  COMPLAINT_NATURES,
  defaultTargetHours,
  suggestStaffTier,
  type ComplaintNatureId,
} from "@/lib/grievanceProcess";
import {
  createTrialIncidentId,
  ensureTrialSeedProject,
  listTrialProjects,
  saveTrialIncident,
  saveTrialProject,
} from "@/lib/trialStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import { aiService } from "@/services/aiService";
import { projectService } from "@/services/projectService";
import type { AiSuggestionStatus, IncidentTriageSuggestion } from "@/types/ai";
import type {
  Incident,
  IncidentGeoContext,
  IncidentPriority,
} from "@/types/incident";
import type { Project } from "@/types/project";
import { ROLE_DEFAULT_DESK_TIER } from "@/types/deskTier";

function asPriority(value: string): IncidentPriority {
  if (
    value === "P1-Critical" ||
    value === "P2-High" ||
    value === "P3-Medium" ||
    value === "P4-Low"
  ) {
    return value;
  }
  return "P3-Medium";
}

const PRIORITY_OPTIONS: IncidentPriority[] = [
  "P4-Low",
  "P3-Medium",
  "P2-High",
  "P1-Critical",
];

type FormPhase = "details" | "categorise";

export default function AppReportIssuePage() {
  const { pushToast } = useToast();
  const [phase, setPhase] = useState<FormPhase>("details");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [geo, setGeo] = useState<IncidentGeoContext | null>(null);
  const [geoLabel, setGeoLabel] = useState("");
  const [geoOpen, setGeoOpen] = useState(false);

  const [nature, setNature] = useState<ComplaintNatureId | "">("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<IncidentPriority | "">("");
  const [seniorFrom, setSeniorFrom] =
    useState<IncidentPriority>("P2-High");
  const [targets] = useState(defaultTargetHours());
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<IncidentTriageSuggestion | null>(
    null,
  );
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const trial = readTrialModeFromDocument();
      if (trial) ensureTrialSeedProject();
      const seeded = await projectService.list();
      const local = trial ? listTrialProjects() : listDemoProjects();
      const byId = new Map<string, Project>();
      for (const p of [...local, ...seeded]) byId.set(p.id, p);
      if (cancelled) return;
      const rows = [...byId.values()];
      setProjects(rows);
      if (rows[0]) setProjectId(rows[0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProject = projects.find((p) => p.id === projectId);
  const escalation =
    priority
      ? suggestStaffTier(asPriority(priority), seniorFrom)
      : null;

  function handleDetailsContinue(event: React.FormEvent) {
    event.preventDefault();
    if (!description.trim()) {
      pushToast("Describe the issue first", "error");
      return;
    }
    if (!anonymous && !reporterName.trim()) {
      pushToast("Enter the reporter name, or mark as anonymous", "error");
      return;
    }
    if (creatingProject) {
      if (!newProjectName.trim()) {
        pushToast("Enter a project name", "error");
        return;
      }
    } else if (!projectId) {
      pushToast("Select or create a project", "error");
      return;
    }
    setGeoOpen(true);
  }

  function ensureProject(): Project {
    if (creatingProject && newProjectName.trim()) {
      const trial = readTrialModeFromDocument();
      const today = new Date().toISOString().slice(0, 10);
      const project: Project = {
        id: trial
          ? `PRJ-T${Date.now().toString().slice(-6)}`
          : createDemoProjectId(),
        name: newProjectName.trim(),
        clientFunder: "",
        budgetTotal: 0,
        budgetSpent: 0,
        ward: geo?.wardName || "",
        municipality: geo?.municipalityName || "",
        status: "Active",
        contractorName: "",
        startDate: today,
        targetEndDate: today,
        publicSummary: "Created from issue intake.",
      };
      if (trial) saveTrialProject(project);
      else saveDemoProject(project);
      setProjects((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        byId.set(project.id, project);
        return [...byId.values()];
      });
      setProjectId(project.id);
      setCreatingProject(false);
      return project;
    }
    const existing = projects.find((p) => p.id === projectId);
    if (existing) return existing;
    throw new Error("Project required");
  }

  function onGeoComplete(ctx: IncidentGeoContext, label: string) {
    setGeo(ctx);
    setGeoLabel(label);
    setPhase("categorise");
    pushToast("Location captured — categorise the issue", "success");
    void runAssist(ctx, label);
  }

  async function runAssist(ctx?: IncidentGeoContext, label?: string) {
    if (!description.trim()) return;
    setError(null);
    setStatus("loading");
    try {
      const result = await aiService.suggestTriage({
        description,
        ward: ctx?.wardName || label || geoLabel || undefined,
        projectId: projectId || undefined,
      });
      setSuggestion(result);
      setStatus("ready");
    } catch (err) {
      setSuggestion(null);
      setError(err instanceof Error ? err.message : "AI assist failed.");
      setStatus("error");
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    setCategory(suggestion.category);
    setPriority(suggestion.suggestedPriority);
    if (suggestion.natureId) {
      const match = COMPLAINT_NATURES.find((n) => n.id === suggestion.natureId);
      if (match) setNature(match.id);
    }
    pushToast("AI categorisation applied — review before submit", "success");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!geo?.wardId) {
      pushToast("Complete location (City → DM → TC → Ward) first", "error");
      return;
    }
    requireEmailThen("save", () => {
      let project: Project;
      try {
        project = ensureProject();
      } catch {
        pushToast("Select or create a project", "error");
        return;
      }
      const now = new Date().toISOString();
      const trial = readTrialModeFromDocument();
      const id = trial ? createTrialIncidentId() : createDemoIncidentId();
      const pri = asPriority(priority || "P3-Medium");
      const policy = suggestStaffTier(pri, seniorFrom);
      const wardLabel = geo.wardName || geoLabel;
      const filedByTier = readDeskTier("community") || ROLE_DEFAULT_DESK_TIER.community;
      const incident: Incident = {
        id,
        title: description.trim().slice(0, 80) || "Community concern",
        description: description.trim(),
        ward: wardLabel,
        geographicArea: geoLabel,
        status: "Open",
        priority: pri,
        projectId: project.id,
        projectName: project.name,
        reportedByRole: "community",
        reporterName: anonymous ? null : reporterName.trim(),
        anonymous,
        filedByTier,
        reportedAt: now,
        slaDueBy: new Date(
          Date.now() + (targets.resolved ?? 72) * 60 * 60 * 1000,
        ).toISOString(),
        slaBreached: false,
        escalationLevel: policy.suggestedTier === "senior" ? "L1" : "None",
        ownerName:
          policy.suggestedTier === "senior"
            ? "Senior desk (unassigned)"
            : "Junior desk (unassigned)",
        category: category || "General grievance",
        nature: nature || undefined,
        impactScore: 40,
        sentimentScore: null,
        geo,
        processStages: {
          reportedAt: now,
          resourceDeployedAt: null,
          investigatedAt: null,
          resolvedAt: null,
          closedAt: null,
          targetHours: targets,
        },
        escalationPolicy: policy,
        timeline: [
          {
            id: `${id}-created`,
            type: "CREATED",
            summary: anonymous
              ? "Anonymous intake logged"
              : `Reported by ${reporterName.trim()}`,
            at: now,
          },
          {
            id: `${id}-project`,
            type: "PROJECT",
            summary: `Linked to project ${project.name}`,
            at: now,
          },
          {
            id: `${id}-geo`,
            type: "LOCATION",
            summary: `Location: ${geoLabel}`,
            at: now,
          },
          {
            id: `${id}-route`,
            type: "ROUTING",
            summary: `Filed as ${filedByTier}; routing ${policy.suggestedTier} — ${policy.reason}`,
            at: now,
          },
        ],
      };
      if (trial) saveTrialIncident(incident);
      else saveDemoIncident(incident);
      setSubmittedId(id);
      pushToast(
        trial
          ? "Issue saved in your trial workspace"
          : "Issue saved in this browser",
        "success",
      );
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Report an issue</h1>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Link to a project, capture reporter and location (City → DM → TC →
          Ward), then categorise. Junior filings surface on the supervisor
          queue.
        </p>
      </div>

      {submittedId ? (
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
          <p className="font-medium">Issue captured — {submittedId}</p>
          <p className="mt-2 text-tl-ink-muted">
            Project, location, and category are on the case for tracking and
            supervisor ranking.
          </p>
          <Link
            href={`/app/incidents/${submittedId}`}
            className="mt-4 inline-block text-sm font-medium text-tl-trust-ink underline"
          >
            Open the new case
          </Link>
          <Link
            href="/app/dashboard"
            className="mt-4 ml-4 inline-block text-sm font-medium text-tl-trust-ink underline"
          >
            Dashboard projects
          </Link>
        </section>
      ) : phase === "details" ? (
        <form
          onSubmit={handleDetailsContinue}
          className="space-y-5 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              1. Issue to be reported
            </label>
            <textarea
              id="description"
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="Describe what happened…"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">2. Reporter</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded border-tl-line"
              />
              Report anonymously
            </label>
            {!anonymous ? (
              <div>
                <label
                  htmlFor="reporterName"
                  className="mb-1 block text-sm font-medium"
                >
                  Name of the reporter
                </label>
                <input
                  id="reporterName"
                  required={!anonymous}
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  placeholder="Full name"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">3. Project</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={creatingProject}
                onChange={(e) => setCreatingProject(e.target.checked)}
                className="rounded border-tl-line"
              />
              Add a new project
            </label>
            {creatingProject ? (
              <input
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                placeholder="New project name"
              />
            ) : (
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-tl-ink-muted">
              The project appears on role dashboards after save.
            </p>
          </div>

          <div className="rounded-md border border-dashed border-tl-line bg-tl-paper/50 px-3 py-3 text-sm text-tl-ink-muted">
            <p className="font-medium text-tl-ink">4. Location (next)</p>
            <p className="mt-1">
              Continue opens City → DM → Traditional council → Ward dialogues.
            </p>
          </div>

          <button
            type="submit"
            className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Continue to location
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <section className="rounded-md border border-tl-line bg-tl-paper/40 px-3 py-3 text-sm">
            <p className="font-medium text-tl-ink">Issue</p>
            <p className="mt-1 text-tl-ink-muted">{description}</p>
            <p className="mt-2 text-xs text-tl-ink-muted">
              Reporter:{" "}
              <span className="font-medium text-tl-ink">
                {anonymous ? "Anonymous" : reporterName}
              </span>
            </p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Project:{" "}
              <span className="font-medium text-tl-ink">
                {creatingProject
                  ? newProjectName || "New project"
                  : selectedProject?.name || "—"}
              </span>
            </p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Location:{" "}
              <span className="font-medium text-tl-ink">{geoLabel}</span>
            </p>
            <button
              type="button"
              onClick={() => setGeoOpen(true)}
              className="mt-2 text-xs font-medium text-tl-trust-ink underline"
            >
              Change location
            </button>
            <button
              type="button"
              onClick={() => setPhase("details")}
              className="ml-3 mt-2 text-xs font-medium text-tl-ink-muted underline"
            >
              Edit details
            </button>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nature" className="mb-1 block text-sm font-medium">
                Nature of complaint
              </label>
              <select
                id="nature"
                required
                value={nature}
                onChange={(e) =>
                  setNature(e.target.value as ComplaintNatureId | "")
                }
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <option value="">Select nature</option>
                {COMPLAINT_NATURES.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="priority"
                className="mb-1 block text-sm font-medium"
              >
                Urgency
              </label>
              <select
                id="priority"
                required
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as IncidentPriority | "")
                }
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <option value="">Select priority</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium">
              Category
            </label>
            <input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="Filled by AI or enter manually"
            />
          </div>

          <div>
            <label
              htmlFor="seniorFrom"
              className="mb-1 block text-sm font-medium"
            >
              Senior intervention from
            </label>
            <select
              id="seniorFrom"
              value={seniorFrom}
              onChange={(e) =>
                setSeniorFrom(e.target.value as IncidentPriority)
              }
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p} and above → senior
                </option>
              ))}
            </select>
            {escalation ? (
              <p className="mt-1 text-xs text-tl-ink-muted">
                Routing:{" "}
                <span className="font-medium text-tl-ink">
                  {escalation.suggestedTier}
                </span>{" "}
                — {escalation.reason}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <AiAssistButton
              onClick={() => void runAssist()}
              loading={status === "loading"}
              disabled={!description.trim()}
            />
            <button
              type="submit"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Submit issue
            </button>
          </div>

          <AiSuggestionPanel
            title="AI categorisation"
            status={status}
            error={error}
            model={suggestion?.model}
            promptVersion={suggestion?.promptVersion}
            confidence={suggestion?.confidence}
            onApply={suggestion ? applySuggestion : undefined}
          >
            {suggestion ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium">Nature</dt>
                  <dd>{suggestion.natureId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Category</dt>
                  <dd>{suggestion.category}</dd>
                </div>
                <div>
                  <dt className="font-medium">Priority</dt>
                  <dd>{suggestion.suggestedPriority}</dd>
                </div>
                <div>
                  <dt className="font-medium">Staff routing</dt>
                  <dd>{suggestion.suggestedStaffTier ?? "—"}</dd>
                </div>
              </dl>
            ) : null}
          </AiSuggestionPanel>
        </form>
      )}

      <GeoLocationWizard
        open={geoOpen}
        onClose={() => setGeoOpen(false)}
        onComplete={onGeoComplete}
      />
    </div>
  );
}
