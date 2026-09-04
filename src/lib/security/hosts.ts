/**
 * Dual-site host detection (TrustLedger product vs Chibase Consulting firm).
 * Email MX stays on Webway; these hosts only serve HTTPS sites.
 */

/** Public marketing apex (ADR-057). Product UI stays on Vercel. */
export const TRUSTLEDGER_APEX_DOMAIN = "trustledgersrm.co.za";

/** Retired public apex — CSP + mail fallback only during DNS cutover. */
export const TRUSTLEDGER_LEGACY_APEX_DOMAIN = "trustledger.co.za";

export const TRUSTLEDGER_CLOUD_HOST = `app.${TRUSTLEDGER_APEX_DOMAIN}`;
export const TRUSTLEDGER_CLOUD_URL = `https://${TRUSTLEDGER_CLOUD_HOST}`;
export const TRUSTLEDGER_MARKETING_URL = `https://${TRUSTLEDGER_APEX_DOMAIN}`;
export const TRUSTLEDGER_WWW_URL = `https://www.${TRUSTLEDGER_APEX_DOMAIN}`;
export const TRUSTLEDGER_INFO_EMAIL = `info@${TRUSTLEDGER_APEX_DOMAIN}`;
export const TRUSTLEDGER_SALES_EMAIL = `sales@${TRUSTLEDGER_APEX_DOMAIN}`;
export const TRUSTLEDGER_NOREPLY_EMAIL = `noreply@${TRUSTLEDGER_APEX_DOMAIN}`;

export const CHIBASE_CANONICAL_HOST = "chibaseconsulting.co.za";

export const TRUSTLEDGER_PRODUCT_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://trustledger-frontend-pi.vercel.app"
).replace(/\/$/, "");

/**
 * Canonical firm origin — set only after DNS cutover.
 * Do not default to the live WordPress host while it is (or was) compromised.
 */
export const CHIBASE_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_CHIBASE_SITE_URL || ""
).replace(/\/$/, "");

const DEFAULT_CHIBASE_HOSTS = [
  CHIBASE_CANONICAL_HOST,
  `www.${CHIBASE_CANONICAL_HOST}`,
  "chibase.localhost",
];

export function chibaseHosts(): string[] {
  const extra = (process.env.CHIBASE_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_CHIBASE_HOSTS, ...extra])];
}

export function hostnameOf(hostHeader: string | null): string {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0]?.trim().toLowerCase() ?? "";
}

export function isChibaseHost(hostHeader: string | null): boolean {
  const host = hostnameOf(hostHeader);
  if (!host) return false;
  return chibaseHosts().includes(host);
}

/** Preview the firm site on the product host before DNS cutover. */
export function isChibasePreviewPath(pathname: string): boolean {
  return pathname === "/firm" || pathname.startsWith("/firm/");
}

export function trustLedgerAbsolute(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${TRUSTLEDGER_PRODUCT_URL}${p}`;
}

/** Internal app path vs public URL on the firm host after rewrite. */
export function firmPath(chibaseHost: boolean, path: string): string {
  if (path === "/") return chibaseHost ? "/" : "/firm";
  return chibaseHost ? path : `/firm${path}`;
}

/** Canonical contact URL recorded on CRM Leads (never the compromised WP origin unless env is set after cutover). */
export function chibaseContactPageUri(request: Request): string {
  if (CHIBASE_PUBLIC_URL) return `${CHIBASE_PUBLIC_URL}/contact`;
  const host = request.headers.get("host");
  if (isChibaseHost(host)) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const hostname = hostnameOf(host) || CHIBASE_CANONICAL_HOST;
    return `${proto}://${hostname}/contact`;
  }
  return `${TRUSTLEDGER_PRODUCT_URL}/firm/contact`;
}

/**
 * Public Chibase URL for a firm path. Uses the canonical firm origin after
 * cutover; otherwise the product-host `/firm` preview.
 */
export function chibasePublicHref(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (CHIBASE_PUBLIC_URL) {
    return p === "/" ? CHIBASE_PUBLIC_URL : `${CHIBASE_PUBLIC_URL}${p}`;
  }
  if (p === "/") return `${TRUSTLEDGER_PRODUCT_URL}/firm`;
  return `${TRUSTLEDGER_PRODUCT_URL}/firm${p}`;
}

/**
 * Paystack callback origin for a consulting checkout started from this request.
 * Firm host → `/packages/success`. Product-host preview → `/firm/packages/success`.
 */
export function chibaseCheckoutCallback(request: Request): {
  origin: string;
  successPath: string;
} {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const hostname = hostnameOf(host);
  if (isChibaseHost(host) && hostname) {
    return {
      origin: `${proto}://${hostname}`,
      successPath: "/packages/success",
    };
  }
  return {
    origin: TRUSTLEDGER_PRODUCT_URL,
    successPath: "/firm/packages/success",
  };
}
