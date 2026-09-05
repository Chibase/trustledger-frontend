/**
 * Tight allowlist for POST /api/frappe — the browser must not reach arbitrary
 * Cloud methods through the same-origin sid proxy.
 */

import { FRAPPE_METHODS } from "@/config/api";

const BLOCKED_SUBSTRINGS = [
  "srm_core.api.ai.compose_activity_report",
  "srm_core.api.ai.generate_report_brief",
  "frappe.client.",
  "frappe.desk.",
  "frappe.handler",
  "frappe.utils.execute",
  "run_doc_method",
  "frappe.core.doctype",
];

const ALLOWED = new Set<string>(
  Object.values(FRAPPE_METHODS).filter(
    (path) => path !== FRAPPE_METHODS.ledgerCreateEntry,
  ),
);

ALLOWED.add("/api/method/frappe.auth.get_logged_user");
ALLOWED.add("/api/method/frappe.ping");

export function normalizeFrappeProxyMethod(method: string): string | null {
  const trimmed = method.trim();
  if (!trimmed.startsWith("/api/method/")) return null;
  if (trimmed.includes("?") || trimmed.includes("#")) return null;
  if (trimmed.includes("\\") || trimmed.includes("..")) return null;
  if (/%/.test(trimmed)) return null;
  if (trimmed.includes("//", 1)) return null;
  return trimmed;
}

export function isAllowedFrappeProxyMethod(method: string): boolean {
  const path = normalizeFrappeProxyMethod(method);
  if (!path) return false;
  const lower = path.toLowerCase();
  if (BLOCKED_SUBSTRINGS.some((frag) => lower.includes(frag.toLowerCase()))) {
    return false;
  }
  return ALLOWED.has(path);
}

export function frappeProxyAllowlist(): string[] {
  return [...ALLOWED].sort();
}
