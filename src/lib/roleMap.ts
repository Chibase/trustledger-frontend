import type { UserRole } from "@/types/rbac";

/** Highest-priority match wins. Keep in sync with srm_core.api.auth.ROLE_PRIORITY. */
const ROLE_PRIORITY: Array<{ trust: UserRole; frappe: string[] }> = [
  { trust: "admin", frappe: ["System Manager", "SRM Admin"] },
  { trust: "client", frappe: ["SRM Lead", "SRM Case Manager"] },
  { trust: "contractor", frappe: ["SRM Analyst"] },
];

export function mapFrappeRolesToTrustLedger(roles: string[]): UserRole {
  const set = new Set(roles);
  for (const row of ROLE_PRIORITY) {
    if (row.frappe.some((r) => set.has(r))) return row.trust;
  }
  return "community";
}
