"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  createStakeholderId,
  stakeholderService,
} from "@/services/stakeholderService";
import {
  STAKEHOLDER_KIND_LABELS,
  type Stakeholder,
  type StakeholderInfluence,
  type StakeholderKind,
  type StakeholderStatus,
} from "@/types/stakeholder";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";

const KINDS = Object.keys(STAKEHOLDER_KIND_LABELS) as StakeholderKind[];

export default function AppStakeholdersPage() {
  const { pushToast } = useToast();
  const [rows, setRows] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<StakeholderKind | "all">("all");
  const [status, setStatus] = useState<StakeholderStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [createKind, setCreateKind] = useState<StakeholderKind>("individual");
  const [organisation, setOrganisation] = useState("");
  const [influence, setInfluence] =
    useState<StakeholderInfluence>("medium");
  const [summary, setSummary] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void stakeholderService
      .list({ query, kind, status })
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, kind, status, reloadToken]);

  const kindCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.kind, (map.get(row.kind) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      pushToast("Enter a stakeholder name", "error");
      return;
    }
    setSaving(true);
    try {
      const row: Stakeholder = {
        id: createStakeholderId(),
        name: name.trim(),
        kind: createKind,
        status: "active",
        organisation: organisation.trim() || undefined,
        countryCode: "ZA",
        influence,
        interests: [],
        tags: [],
        summary: summary.trim() || undefined,
        source: "trial",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await stakeholderService.save(row);
      pushToast("Stakeholder saved", "success");
      setName("");
      setOrganisation("");
      setSummary("");
      setShowCreate(false);
      setReloadToken((n) => n + 1);
    } catch {
      pushToast("Could not save stakeholder", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${NEXT_PRODUCT_VERSION_LABEL} · Stakeholder Intelligence · ${PRODUCT_VERSION_LABEL} desk`}
        title="Stakeholder registry"
        description="The SRM engine starts here — people and organisations linked to place, influence, and engagements. Live sessions persist to Frappe Cloud; trial keeps your own browser workspace (no sample seed)."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreate((open) => !open)}
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              {showCreate ? "Cancel" : "Add stakeholder"}
            </button>
            <Link
              href="/app/capture"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Capture hub
            </Link>
          </div>
        }
      />

      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <h2 className="font-display text-base font-semibold text-tl-ink">
            New stakeholder
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Kind</span>
              <select
                value={createKind}
                onChange={(e) =>
                  setCreateKind(e.target.value as StakeholderKind)
                }
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {STAKEHOLDER_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Influence</span>
              <select
                value={influence}
                onChange={(e) =>
                  setInfluence(e.target.value as StakeholderInfluence)
                }
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Organisation</span>
              <input
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Summary</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save stakeholder"}
          </button>
        </form>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-tl-line bg-tl-surface p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-tl-ink">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, tag, interest…"
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-tl-ink">Kind</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as StakeholderKind | "all")}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            <option value="all">All kinds</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {STAKEHOLDER_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-tl-ink">Status</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as StakeholderStatus | "all")
            }
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-tl-ink-muted">
        {loading
          ? "Loading registry…"
          : `${rows.length} stakeholders · ${kindCounts.size} kinds in view`}
      </p>

      <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/app/stakeholders/${row.id}`}
              className="block px-4 py-4 hover:bg-tl-paper"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-tl-ink">{row.name}</h2>
                <span className="text-xs capitalize text-tl-ink-muted">
                  {STAKEHOLDER_KIND_LABELS[row.kind]} · {row.status} ·{" "}
                  {row.influence} influence
                </span>
              </div>
              {row.summary ? (
                <p className="mt-1 text-sm text-tl-ink-muted">{row.summary}</p>
              ) : null}
              <p className="mt-2 text-xs text-tl-ink-muted">
                {row.organisation ? `${row.organisation} · ` : ""}
                {row.placeId ?? "No place linked"}
                {row.interests.length
                  ? ` · ${row.interests.slice(0, 3).join(", ")}`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
        {!loading && rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-tl-ink-muted">
            No stakeholders yet — add one to start the SRM register.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
