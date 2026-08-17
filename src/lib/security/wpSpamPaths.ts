/**
 * Retired WordPress SEO-spam paths (casino / affiliate injection).
 * Live firm site never served these; crawlers still request indexed URLs.
 * Respond with 410 Gone so search engines drop them faster than soft 404s.
 */

/** Exact slugs observed in SERP / caches after the Webway WP compromise. */
export const WP_SPAM_EXACT_SLUGS = [
  "/subscription",
  "/1xbet-mobile-download-1xbet-apk-steps-and-methods",
  "/best-onlyfans-female-creators-privacy-premium-features-mobile-access-guide",
  "/sexy-onlyfan-girls-in-the-united-states-a-premium-guide-to-privacy-features-experience",
  "/god-of-coins",
  "/jackpotjills-casino",
  "/jackpotjills",
  "/rocket-casino",
  "/popia", // WP page was spam-link-farmed; no firm POPIA page yet
] as const;

/**
 * Path fragment heuristics for injected casino / adult / togel SEO spam.
 * Applied only on the Chibase firm host for unmapped paths.
 */
const WP_SPAM_FRAGMENT_RE =
  /(?:^|[-_/])(?:1xbet|onlyfans?|casino|jackpot|god-of-coins|rocket.?casino|\bbetr\b|togel|yoktogel|patihtoto|rtpslot|slotangk|free.?spins|apk.?download|betting|gambling|roulette|slots?)(?:$|[-_/])/i;

export type WpSpamMatch = {
  reason: "wp_spam_exact" | "wp_spam_heuristic";
  path: string;
};

/** Normalize path for spam matching (no trailing slash except root). */
export function normalizeSpamPath(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "") || "/";
  return trimmed.toLowerCase();
}

export function matchRetiredWpSpam(pathname: string): WpSpamMatch | null {
  const path = normalizeSpamPath(pathname);
  if (path === "/") return null;

  for (const slug of WP_SPAM_EXACT_SLUGS) {
    if (path === slug || path.startsWith(`${slug}/`)) {
      return { reason: "wp_spam_exact", path };
    }
  }

  if (WP_SPAM_FRAGMENT_RE.test(path)) {
    return { reason: "wp_spam_heuristic", path };
  }

  return null;
}
