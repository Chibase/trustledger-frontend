/**
 * Formal and informal authority context.
 * Maps existing stakeholder kind + tags. Does not invent a new CRM kind.
 * High influence is not treated as informal influence.
 */

import type { Stakeholder, StakeholderKind } from "@/types/stakeholder";
import {
  TRUST_AUTHORITY_ROLES,
  type TrustAuthorityRole,
} from "@/types/trustLayer";

const INFORMAL_HINTS = [
  "influencer",
  "informal",
  "informal-influencer",
  "opinion-leader",
  "opinion_leader",
];

const WARD_HINTS = [
  "ward",
  "ward-committee",
  "ward_committee",
  "ward-forum",
  "ward_forum",
  "ward-structure",
  "councillor",
  "councilor",
];

const INSTITUTIONAL_KINDS: StakeholderKind[] = [
  "government",
  "funder",
  "contractor",
  "ngo",
  "academic",
  "media",
];

function haystack(row: Pick<Stakeholder, "tags" | "engagementRole">): string {
  return `${(row.tags || []).join(" ")} ${row.engagementRole || ""}`.toLowerCase();
}

function hasHint(text: string, hints: string[]): boolean {
  return hints.some((hint) => text.includes(hint));
}

/**
 * Read-only classification from existing SRM fields.
 * Kind and explicit tags win. Influence score never decides the role.
 */
export function authorityRoleFromStakeholder(
  row: Pick<Stakeholder, "kind" | "tags" | "influence" | "engagementRole">,
): TrustAuthorityRole {
  const text = haystack(row);

  if (row.kind === "traditional_authority") return "traditional_authority";

  // Explicit informal tags only — never inferred from high influence.
  if (hasHint(text, INFORMAL_HINTS)) return "informal_influencer";

  if (hasHint(text, WARD_HINTS)) return "ward_structure";

  if (INSTITUTIONAL_KINDS.includes(row.kind)) return "institutional_actor";

  if (
    row.kind === "community_group" ||
    row.kind === "faith_based" ||
    row.kind === "union"
  ) {
    return "community_leader";
  }

  return "unknown";
}

export function authorityRoleLabel(role: TrustAuthorityRole): string {
  switch (role) {
    case "traditional_authority":
      return "Traditional authority";
    case "community_leader":
      return "Community leader";
    case "ward_structure":
      return "Ward-level structure";
    case "informal_influencer":
      return "Informal influencer";
    case "institutional_actor":
      return "Institutional actor";
    default:
      return "Unspecified authority role";
  }
}

export function listAuthorityRoles(
  rows: Pick<Stakeholder, "kind" | "tags" | "influence" | "engagementRole">[],
): TrustAuthorityRole[] {
  const seen = new Set<TrustAuthorityRole>();
  for (const row of rows) {
    const role = authorityRoleFromStakeholder(row);
    if (role !== "unknown") seen.add(role);
  }
  return TRUST_AUTHORITY_ROLES.filter((role) => seen.has(role));
}
