/**
 * Language support status for AI triage.
 * Does not machine-translate. Does not default working language to English.
 */

import { narrativeNeedsTranslation } from "@/lib/trust/language";

export type TrustLanguageSupport = {
  preferredLanguage?: string;
  languageDetected: string;
  needsTranslation: boolean;
  /** Always false until a later packet ships community-checked translation. */
  translated: false;
  note: string;
};

export function composeLanguageSupport(input: {
  preferredLanguage?: string;
  spokenLanguage?: string;
  workingLanguage?: string;
  oralSource?: boolean;
}): TrustLanguageSupport {
  const preferred = (input.preferredLanguage || "").trim();
  const spoken = (input.spokenLanguage || preferred).trim();
  const working = (input.workingLanguage || "").trim();
  const oralSource = Boolean(input.oralSource);
  const languageDetected = spoken || "unknown";
  const needsTranslation = narrativeNeedsTranslation({
    spokenLanguage: spoken || undefined,
    workingLanguage: working || undefined,
    translationStatus: oralSource ? "untranslated" : "unknown",
    oralSource,
  });

  const note = needsTranslation
    ? `Preferred / spoken language is ${languageDetected}. TrustLedger does not machine-translate. Keep the source language; do not treat an English desk note as the community voice.`
    : spoken
      ? `Language recorded as ${languageDetected}. No translation was generated.`
      : "No preferred language was given. Language is unknown — not assumed to be English. No translation was generated.";

  return {
    preferredLanguage: preferred || undefined,
    languageDetected,
    needsTranslation,
    translated: false,
    note,
  };
}
