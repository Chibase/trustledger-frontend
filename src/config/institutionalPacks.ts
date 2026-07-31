/**
 * Institutional sector packs (ADR-042) — quote-only lenses under plan `institutional`.
 * Not separate Paystack SKUs. Marketing names only; commercial = quote.
 */

export type InstitutionalPackId =
  | "municipal"
  | "housing"
  | "infrastructure"
  | "renewable";

export type InstitutionalPack = {
  id: InstitutionalPackId;
  name: string;
  /** Short marketing label */
  shortName: string;
  tagline: string;
  /** One-line sell for municipalities / sector buyers */
  sellLine: string;
  /** Honest scope boundaries */
  notIncluded: string;
  focusThemes: string[];
};

export const INSTITUTIONAL_PACK_IDS: InstitutionalPackId[] = [
  "municipal",
  "housing",
  "infrastructure",
  "renewable",
];

export const INSTITUTIONAL_PACKS: Record<
  InstitutionalPackId,
  InstitutionalPack
> = {
  municipal: {
    id: "municipal",
    name: "Municipal / IDP Trust Desk",
    shortName: "Municipal",
    tagline: "Close the IDP information gap with owned commitments and feedback.",
    sellLine:
      "Ward- and municipality-aware desk for participation, grievances, and council-ready commitment trails.",
    notIncluded:
      "Not a full IDP authoring suite, GIS replacement, or municipal ERP / budget system.",
    focusThemes: [
      "Incomplete information → place-based cases & evidence",
      "Unclear responsibilities → commitments with named owners",
      "Little feedback / unclear timelines → status the municipality can show back",
      "Participation without influence → meeting → tracked decision",
    ],
  },
  housing: {
    id: "housing",
    name: "Housing programmes",
    shortName: "Housing",
    tagline: "Beneficiary, contractor, and community trust on housing delivery.",
    sellLine:
      "Track site grievances, stakeholder engagements, and delivery commitments across housing projects.",
    notIncluded: "Not a housing subsidy or beneficiary payment system.",
    focusThemes: [
      "Site and community intake",
      "Contractor / implementing agent desks",
      "Commitment register for handover promises",
      "Board / funder report packs",
    ],
  },
  infrastructure: {
    id: "infrastructure",
    name: "Infrastructure programmes",
    shortName: "Infrastructure",
    tagline: "Roads, water, energy corridors — trust under construction.",
    sellLine:
      "Geo-tagged grievance and stakeholder intelligence for multi-site infrastructure programmes.",
    notIncluded: "Not a civil engineering design or BoQ tool.",
    focusThemes: [
      "Multi-site / corridor projects",
      "Community and land stakeholder registry",
      "Engagement → commitment discipline",
      "Executive and board packs for sponsors",
    ],
  },
  renewable: {
    id: "renewable",
    name: "Renewable energy & just transition",
    shortName: "Renewable",
    tagline: "Host communities, contractors, and sponsors on one trust desk.",
    sellLine:
      "Stakeholder intelligence and grievance desk for renewable sites and community benefit commitments.",
    notIncluded: "Not an energy trading, PPA, or grid operations system.",
    focusThemes: [
      "Host-community engagements",
      "Grievance / benefit commitment tracking",
      "Contractor and developer seats",
      "Funder and board assurance packs",
    ],
  },
};

export function isInstitutionalPackId(
  value: string | null | undefined,
): value is InstitutionalPackId {
  return (
    typeof value === "string" &&
    (INSTITUTIONAL_PACK_IDS as string[]).includes(value)
  );
}

export function quoteHrefForPack(
  packId: InstitutionalPackId,
  utm?: { source?: string; medium?: string; campaign?: string },
): string {
  const params = new URLSearchParams({
    plan: "institutional",
    pack: packId,
    utm_source: utm?.source || "home",
    utm_medium: utm?.medium || "pricing",
    utm_campaign: utm?.campaign || `institutional_${packId}`,
  });
  return `/quote?${params.toString()}`;
}
