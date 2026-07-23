/**
 * T3 / ADR-033 — detect customer (own-data) workspace vs retired sample demo.
 * Customer = trial, live Cloud session, or an org session that is not demo.
 */

import { getActiveOrgId } from "@/lib/orgStore";
import { readTrialModeFromDocument } from "@/lib/trial";

/** Client: never mix demo seed into this workspace. */
export function isCustomerWorkspaceClient(): boolean {
  if (typeof window === "undefined") return false;
  if (readTrialModeFromDocument()) return true;
  const modeMatch = document.cookie.match(/(?:^|;\s*)tl-mode=([^;]*)/);
  const mode = modeMatch?.[1] ? decodeURIComponent(modeMatch[1]) : "";
  if (mode === "live") return true;
  if (mode === "demo") return false;
  if (mode === "trial") return true;
  return Boolean(getActiveOrgId());
}

/** Server / RSC: from AppUser fields. */
export function isCustomerWorkspaceUser(user: {
  mode?: string;
  orgId?: string | null;
}): boolean {
  if (user.mode === "trial" || user.mode === "live") return true;
  if (user.mode === "demo") return false;
  return Boolean(user.orgId);
}
