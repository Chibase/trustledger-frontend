/**
 * Stakeholder profiling for Themba (THEMBA-B / ADR-045).
 * Identifies funder, engineer, PM, local government, MEL, community,
 * and social facilitation practitioners so value props can be tailored
 * without inventing product surfaces.
 */

export const THEMBA_PROFILES = [
  "funder",
  "engineer",
  "project_manager",
  "municipal",
  "mel",
  "community",
  "social_facilitator",
  "other",
] as const;

export type ThembaProfile = (typeof THEMBA_PROFILES)[number];

export const THEMBA_PROFILE_LABELS: Record<ThembaProfile, string> = {
  funder: "Funder / investor",
  engineer: "Civil engineer",
  project_manager: "Project manager",
  municipal: "Local government",
  mel: "MEL / M&E practitioner",
  community: "Community member",
  social_facilitator: "Social facilitator",
  other: "Another role",
};

const PROFILE_PATTERNS: Array<{
  profile: Exclude<ThembaProfile, "other">;
  re: RegExp;
}> = [
  {
    profile: "engineer",
    re: /\b(civil engineer|engineer|engineering|resident engineer|design engineer)\b/i,
  },
  {
    profile: "mel",
    re: /\b(mel|m&e|m and e|monitoring.{0,20}evaluation|evaluation.{0,12}learning|results framework|logframe|indicator (framework|set)|me&l)\b/i,
  },
  {
    profile: "social_facilitator",
    re: /\b(social facilitat|community liaison|clo\b|public participation|pp practitioner|stakeholder engagement (officer|practitioner|specialist)|community relations|social performance|csi officer|ppp practitioner)\b/i,
  },
  {
    profile: "community",
    re: /\b(community member|host community|affected (community|households?)|community representative|community rep|traditional (authority|leader|council|authorities)|kgosi|inkosi|inkosikazi|village chief|chief (and|induna)|village committee|ward committee member)\b/i,
  },
  {
    profile: "funder",
    re: /\b(funder|funders|investor|investors|dfi|dfis|ifc|idc|dbsa|world bank|grant.?maker|financiers?|development finance)\b/i,
  },
  {
    profile: "municipal",
    re: /\b(municipality|municipal|mayor|mmc|councillor|councilor|local government|public sector|government department|cogta|salga|municipal manager|district council|ministry)\b/i,
  },
  {
    profile: "project_manager",
    re: /\b(project manager|programme manager|program manager|pm\b|epcm|site manager|construction manager)\b/i,
  },
];

export function isThembaProfile(value: unknown): value is ThembaProfile {
  return (
    typeof value === "string" &&
    (THEMBA_PROFILES as readonly string[]).includes(value)
  );
}

/** True when the message is mainly a role self-identification. */
export function isProfileIdentityMessage(question: string): boolean {
  const q = question.trim();
  if (q.length > 160) return false;
  return (
    /^(i('m| am)|we are|i work|i'm a|im a|our team)/i.test(q) ||
    /\banother role\b/i.test(q) ||
    THEMBA_PROFILES.some((p) => q.toLowerCase() === p) ||
    Object.values(THEMBA_PROFILE_LABELS).some(
      (label) => q.toLowerCase() === label.toLowerCase(),
    )
  );
}

export function detectThembaProfile(
  question: string,
  hinted?: ThembaProfile | null,
): ThembaProfile | null {
  const q = question.trim();
  if (!q) return hinted ?? null;

  for (const { profile, re } of PROFILE_PATTERNS) {
    if (re.test(q)) return profile;
  }

  if (/\banother role\b/i.test(q) || /^other$/i.test(q)) {
    return "other";
  }

  if (/\b(consultant|contractor|advisor|adviser)\b/i.test(q)) {
    return "other";
  }

  if (hinted && hinted !== "other") return hinted;
  return hinted ?? null;
}
