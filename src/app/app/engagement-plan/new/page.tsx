"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { SEP_SECTOR_PLAYBOOKS, SEP_SECTOR_IDS, SEP_EXAMPLE_BRIEFS } from "@/data/sepSectors";
import { composeEngagementPlan, rebuildSepDocument } from "@/lib/sepComposer";
import { saveEngagementPlan } from "@/lib/sepStore";
import { projectService } from "@/services/projectService";
import type { EngagementPlan, SepSectorId } from "@/types/engagementPlan";
import { SEP_SECTOR_LABELS } from "@/types/engagementPlan";
import type { Project } from "@/types/project";

const ACCEPT =
  ".txt,.md,.csv,.text,.pdf,text/plain,text/markdown,text/csv,application/csv,application/pdf";
const MAX_TEXT_BYTES = 1_500_000;
const MAX_PDF_BYTES = 4 * 1024 * 1024;

function exampleSector(
  search: { get(name: string): string | null },
): SepSectorId | null {
  const example = search.get("example");
  if (example && example in SEP_EXAMPLE_BRIEFS) return example as SepSectorId;
  return null;
}

export default function NewEngagementPlanPage() {
  return (
    <FeatureGate capability="engagements">
      <Suspense
        fallback={
          <p className="text-sm text-tl-ink-muted">Loading compose desk…</p>
        }
      >
        <NewEngagementPlanForm />
      </Suspense>
    </FeatureGate>
  );
}

function NewEngagementPlanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const seeded = exampleSector(searchParams);
  const [text, setText] = useState(
    seeded ? SEP_EXAMPLE_BRIEFS[seeded] : "",
  );
  const [sectorId, setSectorId] = useState<SepSectorId | "auto">(
    seeded || "auto",
  );
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<EngagementPlan | null>(null);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    if (!seeded) return;
    const handle = window.setTimeout(() => {
      setSectorId(seeded);
      setText(SEP_EXAMPLE_BRIEFS[seeded]);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [seeded]);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void projectService.list().then((rows) => {
        if (!cancelled) setProjects(rows);
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, []);

  async function onFile(file: File) {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (isPdf && file.size > MAX_PDF_BYTES) {
      pushToast("PDF is too large (max 4 MB).", "error");
      return;
    }
    if (!isPdf && file.size > MAX_TEXT_BYTES) {
      pushToast("File is too large (max ~1.5 MB text).", "error");
      return;
    }
    setBusy(true);
    try {
      let raw = "";
      if (isPdf) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/app/capture/extract-text", {
          method: "POST",
          body: form,
        });
        const json = (await res.json()) as {
          text?: string;
          error?: string;
          truncated?: boolean;
        };
        if (!res.ok || !json.text) {
          pushToast(json.error || "Could not read PDF text.", "error");
          return;
        }
        raw = json.text;
        if (json.truncated) {
          pushToast(
            "PDF text was truncated to the first section — review before composing.",
            "info",
          );
        }
      } else {
        raw = await file.text();
      }
      setText(raw);
      pushToast("Briefing text loaded. Review, then compose.", "success");
    } finally {
      setBusy(false);
    }
  }

  function compose() {
    if (!text.trim() && sectorId === "auto") {
      pushToast(
        "Paste a briefing, upload a file, or pick a sector playbook.",
        "error",
      );
      return;
    }
    setComposing(true);
    try {
      const project = projects.find((row) => row.id === projectId);
      const plan = composeEngagementPlan({
        text,
        sectorId,
        projectId: projectId || null,
        projectName: project?.name,
      });
      setDraft(plan);
      setTitle(plan.title);
      setPurpose(plan.purposeStatement);
      pushToast("Suggestion ready — edit, then save. Nothing is written to SRM yet.", "success");
    } finally {
      setComposing(false);
    }
  }

  function save() {
    if (!draft) return;
    const next = rebuildSepDocument({
      ...draft,
      title: title.trim() || draft.title,
      purposeStatement: purpose.trim() || draft.purposeStatement,
      status: "saved",
    });
    const saved = saveEngagementPlan(next);
    pushToast("Engagement plan saved.", "success");
    router.push(`/app/engagement-plan/${saved.id}`);
  }

  const playbookHint =
    sectorId !== "auto" ? SEP_SECTOR_PLAYBOOKS[sectorId].summary : null;

  return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Stakeholder Intelligence"
          title="Compose engagement plan"
          description="Suggest → apply → save. The composer reads your briefing locally and maps a seven-phase process for the chosen sector. It does not write stakeholders, engagements, or commitments until you apply on the plan desk after approval."
          actions={
            <Link
              href="/app/engagement-plan"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              All plans
            </Link>
          }
        />

        <section className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="font-display text-base font-semibold text-tl-ink">
            1. Briefing, tender, or RFP
          </h2>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Upload extract</span>
            <input
              type="file"
              accept={ACCEPT}
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
                e.target.value = "";
              }}
              className="block w-full text-sm"
            />
            <span className="mt-1 block text-xs text-tl-ink-muted">
              PDF with a text layer, or .txt / .md / .csv. Scanned photo PDFs
              need a paste if there is no text layer.
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Paste briefing text</span>
            <textarea
              id="sep-briefing-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="Paste the terms of reference, invitation to bid, or scope of work. Named municipalities, traditional councils, and statutes help the composer."
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-xs text-tl-ink-muted">
              {text.trim()
                ? `${text.trim().length} characters loaded`
                : "Empty — paste, upload, insert an example, or pick a sector and compose."}
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              const id = sectorId === "auto" ? "generic" : sectorId;
              setText(SEP_EXAMPLE_BRIEFS[id]);
              if (sectorId === "auto") setSectorId("generic");
              pushToast(
                "Example extract inserted. It is practice text — not a live assignment. Edit or replace before presenting.",
                "info",
              );
            }}
            className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
          >
            Insert example extract
          </button>
        </section>

        <section className="grid gap-4 rounded-lg border border-tl-line bg-tl-surface p-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Sector playbook</span>
            <select
              value={sectorId}
              onChange={(e) =>
                setSectorId(e.target.value as SepSectorId | "auto")
              }
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            >
              <option value="auto">Detect from briefing</option>
              {SEP_SECTOR_IDS.map((id) => (
                <option key={id} value={id}>
                  {SEP_SECTOR_LABELS[id]}
                </option>
              ))}
            </select>
            {playbookHint ? (
              <span className="mt-1 block text-xs text-tl-ink-muted">
                {playbookHint}
              </span>
            ) : (
              <span className="mt-1 block text-xs text-tl-ink-muted">
                Auto uses words in the extract (mining, housing, WULA, IDP…).
                Pick a pack to compose without a file.
              </span>
            )}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Link project (optional)</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            >
              <option value="">Not linked yet</option>
              {projects.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-tl-ink-muted">
              Applied rows inherit this project. Create the project first if the
              assignment is already on the desk.
            </span>
          </label>
        </section>

        <div className="rounded-lg border border-dashed border-tl-line bg-tl-paper/60 p-4 text-sm">
          <p className="font-medium text-tl-ink">Suggestion only</p>
          <p className="mt-1 text-tl-ink-muted">
            The composer does not call a cloud language model. It maps the
            extract onto a sector playbook. Edit before you present to a client.
            Apply to the live SRM is a separate step after approval.
          </p>
          <button
            type="button"
            id="sep-compose-btn"
            disabled={busy || composing}
            onClick={compose}
            className="mt-3 rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
          >
            {composing ? "Composing…" : "Compose suggestion"}
          </button>
        </div>

        {draft ? (
          <section className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4">
            <h2 className="font-display text-base font-semibold text-tl-ink">
              2. Review suggestion
            </h2>
            <p className="text-sm text-tl-ink-muted">
              {SEP_SECTOR_LABELS[draft.sectorId]} · {draft.phases.length} phases ·{" "}
              {draft.stakeholderClasses.length} stakeholder classes ·{" "}
              {draft.activities.length} activities
            </p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Plan title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Purpose statement</span>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <p className="text-sm text-tl-ink">
              {draft.placeHint
                ? `Place sketched: ${draft.placeHint}`
                : "Place not yet clear in the extract."}
              {draft.clientFunderHint
                ? ` Client: ${draft.clientFunderHint}.`
                : ""}
            </p>
            <ol className="grid gap-2 sm:grid-cols-7">
              {draft.phases.map((phase) => (
                <li
                  key={phase.id}
                  className="rounded-md border border-tl-line px-2 py-2 text-center"
                >
                  <span className="block text-[0.65rem] font-semibold uppercase text-tl-trust">
                    {phase.order}
                  </span>
                  <span className="mt-1 block text-xs text-tl-ink">
                    {phase.title}
                  </span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Save plan
            </button>
          </section>
        ) : null}
      </div>
  );
}
