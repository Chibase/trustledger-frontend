export type StakeholderKind =
  | "individual"
  | "organisation"
  | "community_group"
  | "traditional_authority"
  | "government"
  | "ngo";

export type Stakeholder = {
  id: string;
  name: string;
  kind: StakeholderKind;
  organisation?: string;
  placeId?: string;
  influence?: "high" | "medium" | "low";
  interests?: string[];
  email?: string;
  phone?: string;
  summary?: string;
};
