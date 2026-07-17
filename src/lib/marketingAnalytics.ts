/**
 * Marketing homepage analytics hooks (wire to your analytics later).
 * Events: hero_primary_cta_click | hero_secondary_cta_click |
 * nav_book_walkthrough_click | admin_login_click |
 * how_it_works_step_view | final_cta_click
 */

export type MarketingEvent =
  | "hero_primary_cta_click"
  | "hero_secondary_cta_click"
  | "nav_book_walkthrough_click"
  | "admin_login_click"
  | "how_it_works_step_view"
  | "final_cta_click";

export function trackMarketingEvent(
  event: MarketingEvent,
  payload?: Record<string, string | number | boolean | undefined>,
): void {
  // analytics: push to dataLayer / segment / plausible when configured
  if (typeof window === "undefined") return;
  try {
    const w = window as Window & {
      dataLayer?: Array<Record<string, unknown>>;
    };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...payload });
  } catch {
    // no-op
  }
}
