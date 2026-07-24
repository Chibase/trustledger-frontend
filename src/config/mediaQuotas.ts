/**
 * T4 — plan media storage quotas (browser until Cloud File / T5).
 */

import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";

/** Soft caps in bytes for org media in the browser data space. */
export const PLAN_MEDIA_QUOTA_BYTES: Record<PlanId, number> = {
  practitioner: 25 * 1024 * 1024, // 25 MB
  project: 250 * 1024 * 1024, // 250 MB
  institutional: 2 * 1024 * 1024 * 1024, // 2 GB soft demo cap
};

/** Max single attachment stored as data URL in browser. */
export const MAX_INLINE_MEDIA_BYTES = 2 * 1024 * 1024; // 2 MB

export const MEDIA_KINDS = [
  "register",
  "minutes",
  "photo",
  "video",
  "other",
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  register: "Attendance register",
  minutes: "Meeting minutes",
  photo: "Photo / site evidence",
  video: "Video",
  other: "Other document",
};

export function mediaQuotaBytes(planId?: PlanId | null): number {
  if (!planId) return PLAN_MEDIA_QUOTA_BYTES.project; // demo lens
  return PLAN_MEDIA_QUOTA_BYTES[planId];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function upgradeHrefForMedia(planId?: PlanId | null): string {
  if (!planId || planId === "practitioner") {
    return "/pay?plan=project&utm_source=settings&utm_medium=media_quota&utm_campaign=upgrade_project";
  }
  if (planId === "project") {
    return "/pay?plan=institutional&utm_source=settings&utm_medium=media_quota&utm_campaign=upgrade_institutional";
  }
  return "/contact?utm_source=settings&utm_medium=media_quota";
}

export function upgradeLabelForMedia(planId?: PlanId | null): string {
  if (!planId || planId === "practitioner") {
    return `Upgrade to ${PLANS.project.name} (${formatBytes(PLAN_MEDIA_QUOTA_BYTES.project)})`;
  }
  if (planId === "project") {
    return `Upgrade to ${PLANS.institutional.name} for larger media`;
  }
  return "Contact sales for dedicated storage";
}
