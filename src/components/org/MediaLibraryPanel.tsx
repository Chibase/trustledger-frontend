"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  formatBytes,
  MEDIA_KIND_LABELS,
  MEDIA_KINDS,
  type MediaKind,
  upgradeHrefForMedia,
  upgradeLabelForMedia,
} from "@/config/mediaQuotas";
import { useToast } from "@/components/ui/Toast";
import {
  addOrgMedia,
  guessMediaKind,
  listOrgMedia,
  orgMediaQuotaSnapshot,
  readFileForOrgMedia,
  removeOrgMedia,
  type OrgMediaItem,
} from "@/lib/orgMedia";
import { getActiveOrg } from "@/lib/orgStore";

type MediaLibraryPanelProps = {
  planId?: PlanId | null;
  isPlanOwner: boolean;
};

/**
 * T4 — Plan Owner media library with plan storage quotas.
 */
export function MediaLibraryPanel({
  planId,
  isPlanOwner,
}: MediaLibraryPanelProps) {
  const { pushToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<MediaKind>("photo");
  const [items, setItems] = useState<OrgMediaItem[]>([]);
  const [snap, setSnap] = useState(() => orgMediaQuotaSnapshot(planId));

  function refresh() {
    setItems(listOrgMedia());
    setSnap(orgMediaQuotaSnapshot(planId));
    setReady(true);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  if (!isPlanOwner) return null;

  const planLabel = planId ? PLANS[planId].name : "Demo (Project lens)";
  const org = typeof window !== "undefined" ? getActiveOrg() : null;

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      try {
        const read = await readFileForOrgMedia(file);
        const result = addOrgMedia({
          kind: kind === "other" ? guessMediaKind(file.name, file.type) : kind,
          fileName: read.fileName,
          mimeType: read.mimeType,
          sizeBytes: read.sizeBytes,
          dataUrl: read.dataUrl,
          planId,
          uploadedBy: org?.ownerName || "Plan Owner",
        });
        if (!result.ok) {
          pushToast(result.error, "error");
          break;
        }
        pushToast(`Added ${result.item.fileName}`, "success");
      } catch {
        pushToast(`Failed to read ${file.name}`, "error");
      }
    }
    refresh();
    if (inputRef.current) inputRef.current.value = "";
  }

  function onRemove(id: string) {
    removeOrgMedia(id);
    refresh();
    pushToast("Media removed", "success");
  }

  return (
    <section
      id="media-library"
      className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
    >
      <h2 className="font-semibold text-tl-ink">Media library</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Registers, minutes, photos, and video for your organisation. Stored in
        this browser under your org until Cloud File (T5). Plan ({planLabel})
        sets the soft quota.
      </p>

      {!ready ? (
        <p className="mt-3 text-xs text-tl-ink-muted">Loading media…</p>
      ) : (
        <>
          <div className="mt-4">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="text-tl-ink-muted">Storage used</span>
              <span className="font-medium tabular-nums text-tl-ink">
                {formatBytes(snap.usedBytes)} / {formatBytes(snap.quotaBytes)} (
                {snap.percent}%)
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-sm bg-tl-paper">
              <div
                className={`h-full rounded-sm ${
                  snap.percent >= 90 ? "bg-tl-amber" : "bg-tl-trust"
                }`}
                style={{ width: `${snap.percent}%` }}
              />
            </div>
            {snap.overQuota || snap.percent >= 85 ? (
              <p className="mt-2 text-xs text-tl-amber">
                Approaching or over quota.{" "}
                <Link
                  href={upgradeHrefForMedia(planId)}
                  className="font-medium underline"
                >
                  {upgradeLabelForMedia(planId)}
                </Link>
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-xs">
              <span className="mb-1 block font-medium">Kind</span>
              <select
                className="rounded-md border border-tl-line px-2 py-1.5"
                value={kind}
                onChange={(e) => setKind(e.target.value as MediaKind)}
              >
                {MEDIA_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {MEDIA_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              className="text-xs"
              onChange={(e) => void onFilesSelected(e.target.files)}
            />
          </div>
          <p className="mt-1 text-[11px] text-tl-ink-muted">
            Files over 2 MB are stored as metadata only (name + size) in this
            browser — full Cloud File upload arrives with T5.
          </p>

          {items.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-tl-line bg-tl-paper/40 px-3 py-4 text-xs text-tl-ink-muted">
              No media yet. Upload registers, minutes, or site photos for this
              org.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-tl-line overflow-hidden rounded-md border border-tl-line">
              {items.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-tl-ink">
                      {m.fileName}
                    </p>
                    <p className="text-[11px] text-tl-ink-muted">
                      {MEDIA_KIND_LABELS[m.kind]} · {formatBytes(m.sizeBytes)}
                      {m.dataUrl ? " · inline preview" : " · metadata only"}
                      {m.incidentId ? ` · ${m.incidentId}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(m.id)}
                    className="text-xs font-medium text-tl-ink-muted hover:text-tl-ink hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
