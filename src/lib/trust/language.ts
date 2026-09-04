/**
 * Language / communication readiness — structures only, not a product i18n pack.
 * Working language is never defaulted to English.
 */

import {
  TRUST_TRANSLATION_STATUSES,
  type TrustTranslationStatus,
} from "@/types/trustLayer";

/** Hints for field capture. Not a closed list and not a default. */
export const COMMUNITY_LANGUAGE_HINTS = [
  "isiZulu",
  "isiXhosa",
  "Sesotho",
  "Setswana",
  "Sepedi",
  "Xitsonga",
  "Tshivenda",
  "siSwati",
  "isiNdebele",
  "Afrikaans",
  "English",
  "Portuguese",
  "French",
  "Swahili",
  "Arabic",
  "Shona",
  "Chichewa",
  "Yoruba",
  "Hausa",
  "Amharic",
  "Other / describe in notes",
] as const;

export type TrustNarrativeCapture = {
  spokenLanguage?: string;
  workingLanguage?: string;
  translationStatus: TrustTranslationStatus;
  oralSource: boolean;
  /** Free narrative is allowed; structured fields stay optional. */
  flexibleNarrative: boolean;
};

export function emptyTrustNarrativeCapture(): TrustNarrativeCapture {
  return {
    translationStatus: "unknown",
    oralSource: false,
    flexibleNarrative: true,
  };
}

export function isTrustTranslationStatus(
  value: unknown,
): value is TrustTranslationStatus {
  return TRUST_TRANSLATION_STATUSES.includes(value as TrustTranslationStatus);
}

export function asTrustTranslationStatus(
  value: unknown,
): TrustTranslationStatus {
  return isTrustTranslationStatus(value) ? value : "unknown";
}

function sameLanguage(a?: string, b?: string): boolean {
  const left = (a || "").trim().toLowerCase();
  const right = (b || "").trim().toLowerCase();
  return Boolean(left) && left === right;
}

/**
 * True when the spoken / oral account is not yet in a community-checked
 * working language. Unknown languages do not assume English.
 */
export function narrativeNeedsTranslation(
  capture: Pick<
    TrustNarrativeCapture,
    "spokenLanguage" | "workingLanguage" | "translationStatus" | "oralSource"
  >,
): boolean {
  if (capture.translationStatus === "community_checked") return false;
  if (capture.translationStatus === "untranslated") return true;
  if (capture.oralSource && capture.translationStatus !== "working_language") {
    return true;
  }
  const spoken = (capture.spokenLanguage || "").trim();
  const working = (capture.workingLanguage || "").trim();
  if (spoken && working && !sameLanguage(spoken, working)) return true;
  return false;
}
