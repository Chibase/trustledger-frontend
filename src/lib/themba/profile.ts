/**
 * Stakeholder profiling for Themba (THEMBA-B).
 * Identifies funder / engineer / project manager / municipal leader early
 * so value props and CTAs can be tailored without inventing product surfaces.
 */

export const THEMBA_PROFILES = [
  "funder",
  "engineer",
  "project_manager",
  "municipal",
  "other",
] as const;

export type ThembaProfile = (typeof THEMBA_PROFILES)[number];

export const THEMBA_PROFILE_LABELS: Record<ThembaProfile, string> = {
  funder: "Funder / investor",
  engineer: "Civil engineer",
  project_manager: "Project manager",
  municipal: "Municipal leader",
  other: "Another role",
};

const PROFILE_PATTERNS: Array<{
  profile: Exclude<ThembaProfile, "other">;
  re: RegExp;
}> = [
  {
    profile: "funder",
    re: /\b(funder|funders|investor|investors|dfi|dfis|ifc|idc|dbsa|world bank|grant.?maker|financiers?|development finance)\b/i,
  },
  {
    profile: "municipal",
    re: /\b(municipality|municipal|mayor|mmc|councillor|councilor|local government|public sector|government department|cogta|salga|municipal manager)\b/i,
  },
  {
    profile: "project_manager",
    re: /\b(project manager|programme manager|program manager|pm\b|epcm|site manager|construction manager)\b/i,
  },
  {
    profile: "engineer",
    re: /\b(civil engineer|engineer|engineering|resident engineer|design engineer)\b/i,
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
  if (q.length > 80) return false;
  return (
    /^(i('m| am)|we are|i work|i'm a|im a|our team)/i.test(q) ||
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
  if (hinted && hinted !== "other") return hinted;
  const q = question.trim();
  if (!q) return hinted ?? null;

  for (const { profile, re } of PROFILE_PATTERNS) {
    if (re.test(q)) return profile;
  }

  if (
    /\b(consultant|liaison|clo|social facilitator|contractor|community)\b/i.test(
      q,
    )
  ) {
    return "other";
  }

  return hinted ?? null;
}
