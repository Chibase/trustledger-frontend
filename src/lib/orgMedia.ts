/**
 * T4 — org media library (registers, minutes, photos, video) with quotas.
 */

import type { PlanId } from "@/config/plans";
import {
  MAX_INLINE_MEDIA_BYTES,
  MEDIA_KINDS,
  type MediaKind,
  mediaQuotaBytes,
} from "@/config/mediaQuotas";
import { getActiveOrgId } from "@/lib/orgStore";
import { saveOrgEvidence } from "@/lib/orgDataSpace";
import type { EvidenceStub } from "@/types/engagement";

const MEDIA_KEY = "tl-org-media";

export type OrgMediaItem = {
  id: string;
  orgId: string;
  kind: MediaKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Optional small inline payload (data URL) — omitted when over inline cap. */
  dataUrl?: string;
  incidentId?: string;
  projectId?: string;
  projectName?: string;
  uploadedBy: string;
  uploadedAt: string;
  classification: EvidenceStub["classification"];
};

type MediaRoot = Record<string, OrgMediaItem[]>;

function readRoot(): MediaRoot {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MEDIA_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MediaRoot;
  } catch {
    return {};
  }
}

function writeRoot(map: MediaRoot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEDIA_KEY, JSON.stringify(map));
}

export function listOrgMedia(orgId?: string | null): OrgMediaItem[] {
  const id = orgId || getActiveOrgId();
  if (!id) return [];
  return readRoot()[id] || [];
}

export function orgMediaUsedBytes(orgId?: string | null): number {
  return listOrgMedia(orgId).reduce((sum, m) => sum + (m.sizeBytes || 0), 0);
}

export function orgMediaQuotaSnapshot(
  planId?: PlanId | null,
  orgId?: string | null,
): {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  percent: number;
  overQuota: boolean;
  count: number;
} {
  const usedBytes = orgMediaUsedBytes(orgId);
  const quotaBytes = mediaQuotaBytes(planId);
  const remainingBytes = Math.max(0, quotaBytes - usedBytes);
  return {
    usedBytes,
    quotaBytes,
    remainingBytes,
    percent: Math.min(100, Math.round((usedBytes / Math.max(1, quotaBytes)) * 100)),
    overQuota: usedBytes >= quotaBytes,
    count: listOrgMedia(orgId).length,
  };
}

export type AddMediaResult =
  | { ok: true; item: OrgMediaItem }
  | { ok: false; error: string };

export function addOrgMedia(input: {
  kind: MediaKind;
  fileName: string;
  mimeType?: string;
  sizeBytes: number;
  dataUrl?: string;
  incidentId?: string;
  projectId?: string;
  projectName?: string;
  uploadedBy?: string;
  planId?: PlanId | null;
  orgId?: string | null;
  classification?: EvidenceStub["classification"];
}): AddMediaResult {
  const orgId = input.orgId || getActiveOrgId();
  if (!orgId) {
    return { ok: false, error: "No organisation — start trial or subscribe first." };
  }
  if (!MEDIA_KINDS.includes(input.kind)) {
    return { ok: false, error: "Unknown media kind." };
  }
  const snap = orgMediaQuotaSnapshot(input.planId, orgId);
  if (snap.usedBytes + input.sizeBytes > snap.quotaBytes) {
    return {
      ok: false,
      error: `Storage quota exceeded (${snap.percent}% used). Upgrade plan or remove media.`,
    };
  }

  const inline =
    input.dataUrl && input.sizeBytes <= MAX_INLINE_MEDIA_BYTES
      ? input.dataUrl
      : undefined;

  const item: OrgMediaItem = {
    id: `MED-${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    orgId,
    kind: input.kind,
    fileName: input.fileName.trim() || "untitled",
    mimeType: input.mimeType || "application/octet-stream",
    sizeBytes: Math.max(0, Math.floor(input.sizeBytes)),
    dataUrl: inline,
    incidentId: input.incidentId,
    projectId: input.projectId,
    projectName: input.projectName,
    uploadedBy: input.uploadedBy || "Plan Owner",
    uploadedAt: new Date().toISOString(),
    classification: input.classification || "General",
  };

  const root = readRoot();
  const rows = root[orgId] || [];
  root[orgId] = [item, ...rows];
  writeRoot(root);

  // Mirror into evidence stubs when linked to a case (same shapes as demo).
  if (item.incidentId) {
    saveOrgEvidence(
      {
        id: item.id,
        incidentId: item.incidentId,
        fileName: item.fileName,
        classification: item.classification,
        uploadedBy: item.uploadedBy,
        uploadedAt: item.uploadedAt,
        isPrimary: false,
      },
      orgId,
    );
  }

  return { ok: true, item };
}

export function removeOrgMedia(mediaId: string, orgId?: string | null): boolean {
  const id = orgId || getActiveOrgId();
  if (!id) return false;
  const root = readRoot();
  const rows = root[id] || [];
  const next = rows.filter((m) => m.id !== mediaId);
  if (next.length === rows.length) return false;
  root[id] = next;
  writeRoot(root);
  return true;
}

export function guessMediaKind(fileName: string, mimeType?: string): MediaKind {
  const name = fileName.toLowerCase();
  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/.test(name)) {
    return "video";
  }
  if (mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/.test(name)) {
    return "photo";
  }
  if (/minute|mom|minutes/.test(name)) return "minutes";
  if (/register|attendance|sign[- ]?in/.test(name)) return "register";
  return "other";
}

/** Read a File into optional data URL (skipped when over inline cap). */
export function readFileForOrgMedia(file: File): Promise<{
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  dataUrl?: string;
}> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_INLINE_MEDIA_BYTES) {
      resolve({
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        fileName: file.name,
      });
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      resolve({
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        fileName: file.name,
        dataUrl: typeof reader.result === "string" ? reader.result : undefined,
      });
    };
    reader.readAsDataURL(file);
  });
}
