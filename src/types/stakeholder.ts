/**
 * In-platform stakeholder CRM (Version 002) — TEDS registry kinds.
 * Demo seed + trial localStorage; Frappe DocTypes later.
 */

export type StakeholderKind =
  | "individual"
  | "organisation"
  | "community_group"
  | "traditional_authority"
  | "government"
  | "ngo"
  | "contractor"
  | "funder"
  | "media"
  | "union"
  | "faith_based"
  | "academic"
  | "other";

export type StakeholderStatus = "active" | "inactive" | "prospect";

export type StakeholderInfluence = "high" | "medium" | "low" | "unknown";

export type Stakeholder = {
  id: string;
  name: string;
  kind: StakeholderKind;
  status: StakeholderStatus;
  /** Organisation / employer display name */
  organisation?: string;
  placeId?: string;
  countryCode?: string;
  influence: StakeholderInfluence;
  interests: string[];
  tags: string[];
  email?: string;
  phone?: string;
  alternativeContact?: string;
  summary?: string;
  /** Free-text role on projects / programmes */
  engagementRole?: string;
  preferredChannel?: "meeting" | "phone" | "email" | "whatsapp" | "letter";
  /** Linked CRM records */
  relatedStakeholderIds?: string[];
  projectIds?: string[];
  lastEngagedOn?: string;
  nextAction?: string;
  ownerUserId?: string;
  source?: "seed" | "trial" | "live";
  createdAt?: string;
  updatedAt?: string;
};

export const STAKEHOLDER_KIND_LABELS: Record<StakeholderKind, string> = {
  individual: "Individual",
  organisation: "Organisation",
  community_group: "Community group",
  traditional_authority: "Traditional authority",
  government: "Government",
  ngo: "NGO / CSO",
  contractor: "Contractor",
  funder: "Funder / investor",
  media: "Media",
  union: "Labour union",
  faith_based: "Faith-based",
  academic: "Academic / research",
  other: "Other",
};
