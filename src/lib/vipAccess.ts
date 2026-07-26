/**
 * VIP complimentary access helpers (ADR-037).
 */

import type { AppUser } from "@/lib/auth";
import { isVipAccessMode, type VipAccessMode } from "@/types/vipAccess";

export function accessModeOf(user: Pick<AppUser, "accessMode"> | null | undefined): VipAccessMode {
  return user?.accessMode === "vip_viewer" ? "vip_viewer" : "full";
}

export function isVipViewer(user: Pick<AppUser, "accessMode"> | null | undefined): boolean {
  return accessModeOf(user) === "vip_viewer";
}

/** Desk mutations (create/edit/delete) — VIP viewers blocked. */
export function canMutateDesk(user: Pick<AppUser, "accessMode"> | null | undefined): boolean {
  return !isVipViewer(user);
}

/** Print, PDF, download, clipboard share of desk content. */
export function canPrintOrShare(user: Pick<AppUser, "accessMode"> | null | undefined): boolean {
  return !isVipViewer(user);
}

/** Client cookie read (browser only). */
export function readAccessModeCookie(): VipAccessMode {
  if (typeof document === "undefined") return "full";
  const match = document.cookie.match(/(?:^|;\s*)tl-access-mode=([^;]+)/);
  const raw = match?.[1] ? decodeURIComponent(match[1]) : "";
  return isVipAccessMode(raw) ? raw : "full";
}

export function readVipOrgCookie(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)tl-vip-org=1(?:;|$)/.test(document.cookie);
}

export function clientIsVipViewer(): boolean {
  return readAccessModeCookie() === "vip_viewer";
}

export function assertClientCanMutateDesk(): void {
  if (clientIsVipViewer()) {
    throw new Error(
      "VIP guest access is view and comment only. Ask the Plan Owner if you need full input rights.",
    );
  }
}

export const VIP_VIEWER_COPY =
  "VIP guest seat — view and comment only. Printing, downloads, and sharing desk information are disabled.";
