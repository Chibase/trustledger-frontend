/**
 * Block WordPress / malware reconnaissance before it reaches the app.
 * Compromised WP on Webway used wp-login probes + injected ClickFix scripts;
 * this origin is Next.js and has none of those surfaces.
 */

export const BLOCKED_PATH_PREFIXES = [
  "/wp-admin",
  "/wp-login.php",
  "/wp-login",
  "/wp-content",
  "/wp-includes",
  "/wp-json",
  "/xmlrpc.php",
  "/xmlrpc",
  "/wordpress",
  "/phpmyadmin",
  "/phpinfo.php",
  "/.env",
  "/.git",
  "/vendor/phpunit",
  "/autoload_classmap",
  "/wp-config",
  "/shell.php",
  "/eval-stdin.php",
] as const;

const BLOCKED_EXACT = new Set([
  "/wp-cron.php",
  "/wlwmanifest.xml",
  "/xmlrpc.php",
]);

const LEGACY_RUNTIME_RE = /\.(?:php|asp|aspx|cgi|jsp)(?:\/|$)/i;

const BLOCKED_QUERY_RE =
  /(?:union\s+select|<\s*script|javascript:|data:text\/html|eval\s*\(|base64_decode)/i;

export type ProbeMatch = {
  reason: string;
  path: string;
};

export function matchMaliciousProbe(
  pathname: string,
  search: string,
): ProbeMatch | null {
  const path = pathname.toLowerCase();
  if (BLOCKED_EXACT.has(path)) {
    return { reason: "blocked_exact", path };
  }
  if (LEGACY_RUNTIME_RE.test(path) || path.endsWith(".env")) {
    return { reason: "blocked_legacy_runtime", path };
  }
  for (const prefix of BLOCKED_PATH_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix)) {
      return { reason: "blocked_wp_or_probe", path };
    }
  }
  if (search && BLOCKED_QUERY_RE.test(search)) {
    return { reason: "blocked_query", path };
  }
  return null;
}
