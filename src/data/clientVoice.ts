import { findPublicCopyViolations } from "@/lib/marketing/voice";

/**
 * Consented client / operator voice for public marketing sites.
 * Empty until a human harvests a Workspace comment and records consent.
 * Never invent named-client quotes.
 */

export type ClientVoiceConsent = "named" | "role-only";
export type ClientVoiceBrand = "trustledger" | "chibase";
export type ClientVoiceSurface = "home" | "product" | "firm";

export type ClientVoiceQuote = {
  id: string;
  quote: string;
  /** Display line. Named only when consent is `named`. */
  attribution: string;
  brand: ClientVoiceBrand | "both";
  surfaces: ClientVoiceSurface[];
  consent: ClientVoiceConsent;
  /** ClickUp task or Drive URL — internal, not rendered. */
  sourceRef?: string;
};

/** Human-applied catalog. Do not scrape Gmail or Docs into this file. */
export const CLIENT_VOICE_QUOTES: ClientVoiceQuote[] = [];

export function quotesFor(
  brand: ClientVoiceBrand,
  surface: ClientVoiceSurface,
  catalog: ClientVoiceQuote[] = CLIENT_VOICE_QUOTES,
): ClientVoiceQuote[] {
  return catalog.filter((entry) => {
    if (entry.consent !== "named" && entry.consent !== "role-only") return false;
    if (entry.brand !== "both" && entry.brand !== brand) return false;
    if (!entry.surfaces.includes(surface)) return false;
    const text = `${entry.quote} ${entry.attribution}`;
    if (findPublicCopyViolations(text).length > 0) return false;
    return entry.quote.trim().length > 0;
  });
}
