/**
 * VIP guest comments — browser store (marketing wall export later).
 */

import type { VipGuestComment, VipGuestProfile } from "@/types/vipAccess";

const KEY = "tl-vip-comments";
const MAX_FACE_BYTES = 180 * 1024; // ~180 KB soft cap for data URLs

function readAll(): VipGuestComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VipGuestComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: VipGuestComment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("tl-vip-comments-changed"));
}

export function listVipComments(orgId?: string | null): VipGuestComment[] {
  const all = readAll();
  if (!orgId) return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return all
    .filter((c) => c.orgId === orgId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listPublishableVipComments(orgId?: string | null): VipGuestComment[] {
  return listVipComments(orgId).filter((c) => c.publishConsent);
}

export function validateFaceDataUrl(dataUrl: string | undefined): string | undefined {
  if (!dataUrl) return undefined;
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Face picture must be an image file.");
  }
  // Rough byte estimate from base64 length
  const b64 = dataUrl.split(",")[1] || "";
  const bytes = Math.floor((b64.length * 3) / 4);
  if (bytes > MAX_FACE_BYTES) {
    throw new Error("Face picture is too large (max ~180 KB). Use a smaller photo.");
  }
  return dataUrl;
}

export function addVipComment(input: {
  orgId: string;
  projectId?: string;
  projectName?: string;
  profile: VipGuestProfile;
  body: string;
  publishConsent: boolean;
}): { ok: true; comment: VipGuestComment } | { ok: false; error: string } {
  const body = input.body.trim();
  if (body.length < 10) {
    return { ok: false, error: "Comment must be at least 10 characters." };
  }
  const p = input.profile;
  if (p.displayName.trim().length < 2) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!p.email.includes("@")) {
    return { ok: false, error: "Please enter a valid email." };
  }
  if (p.roleOnProject.trim().length < 2) {
    return { ok: false, error: "Please describe your role on this project." };
  }
  if (p.rank.trim().length < 2) {
    return { ok: false, error: "Please enter your rank or seniority." };
  }
  if (p.entity.trim().length < 2) {
    return { ok: false, error: "Please enter your entity / organisation." };
  }

  let face: string | undefined;
  try {
    face = validateFaceDataUrl(p.faceDataUrl);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Invalid face picture.",
    };
  }

  const comment: VipGuestComment = {
    id: `vpc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    orgId: input.orgId,
    projectId: input.projectId,
    projectName: input.projectName,
    profile: {
      displayName: p.displayName.trim(),
      email: p.email.trim().toLowerCase(),
      roleOnProject: p.roleOnProject.trim(),
      rank: p.rank.trim(),
      entity: p.entity.trim(),
      faceDataUrl: face,
    },
    body,
    createdAt: new Date().toISOString(),
    publishConsent: Boolean(input.publishConsent),
  };

  const next = [comment, ...readAll()];
  writeAll(next);
  return { ok: true, comment };
}

/** JSON export for marketing / website client-comment wall. */
export function exportVipCommentsJson(orgId?: string | null): string {
  const rows = listPublishableVipComments(orgId).map((c) => ({
    id: c.id,
    projectName: c.projectName || null,
    name: c.profile.displayName,
    email: c.profile.email,
    roleOnProject: c.profile.roleOnProject,
    rank: c.profile.rank,
    entity: c.profile.entity,
    faceDataUrl: c.profile.faceDataUrl || null,
    body: c.body,
    createdAt: c.createdAt,
  }));
  return JSON.stringify({ source: "trustledger-vip-comments", comments: rows }, null, 2);
}
