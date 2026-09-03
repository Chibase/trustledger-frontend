/**
 * Shared security headers for TrustLedger + Chibase origins.
 * Assessment may still be framed from the WordPress marketing host.
 * CSP frame-ancestors is the frame policy — do not also set X-Frame-Options
 * (SAMEORIGIN would break the assessment embed on the marketing apex).
 */

import {
  TRUSTLEDGER_APEX_DOMAIN,
  TRUSTLEDGER_LEGACY_APEX_DOMAIN,
} from "./hosts";

const FRAME_ANCESTORS = [
  "'self'",
  `https://${TRUSTLEDGER_APEX_DOMAIN}`,
  `https://www.${TRUSTLEDGER_APEX_DOMAIN}`,
  `https://${TRUSTLEDGER_LEGACY_APEX_DOMAIN}`,
  `https://www.${TRUSTLEDGER_LEGACY_APEX_DOMAIN}`,
].join(" ");

function scriptSrc(): string {
  const parts = [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    "https://js.paystack.co",
    "https://www.google.com",
    "https://www.gstatic.com",
    "https://www.recaptcha.net",
    "https://va.vercel-scripts.com",
  ];
  if (process.env.NODE_ENV !== "production") {
    parts.push("'unsafe-eval'");
  }
  return parts.join(" ");
}

/** CSP that allows checkout + reCAPTCHA + analytics; blocks injected third-party scripts. */
export function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    scriptSrc(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    [
      "connect-src",
      "'self'",
      "https://www.google.com",
      "https://www.gstatic.com",
      "https://www.recaptcha.net",
      "https://api.paystack.co",
      "https://vitals.vercel-insights.com",
      "https://va.vercel-scripts.com",
    ].join(" "),
    [
      "frame-src",
      "'self'",
      "https://js.paystack.co",
      "https://checkout.paystack.com",
      "https://www.google.com",
      "https://www.recaptcha.net",
    ].join(" "),
    `frame-ancestors ${FRAME_ANCESTORS}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
    "report-uri /api/security/csp-report",
  ].join("; ");
}

export const SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];
