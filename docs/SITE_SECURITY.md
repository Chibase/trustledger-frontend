# Public-site security (TrustLedger + Chibase)

**Locked:** ADR-046.  
**Honest limit:** No public site is unhackable. This packet **hardens**, **detects**, and **blocks common attacks** (especially the WordPress/ClickFix class that hit Chibase). It does not replace pentests, DPA, or tenant isolation (ADR-038).

## What shipped

| Control | Where | Effect |
|---------|--------|--------|
| Security headers (CSP, HSTS, nosniff, frame-ancestors, Permissions-Policy) | `next.config.ts` + `src/proxy.ts` | Injected third-party scripts (casino widgets, fake “Human Verification”) cannot run as they did on the hacked WP theme; HTTPS enforced |
| CSP reports | `POST /api/security/csp-report` | Browser sends blocked-script reports (rate-limited; no outbound alert — noisy) |
| Probe block | `src/proxy.ts` | `/wp-admin`, `*.php`, `/xmlrpc.php`, `.env`, phpunit, SQLi/XSS query shapes → **404** (no WP/PHP surface exists here) |
| Probe + form log | In-process ring + hosting logs | Proxy runs on Node (Next 16); `recordSecurityEvent` + `console.warn("[security] …")`. Optional `SECURITY_ALERT_WEBHOOK_URL` (external only) |
| Form events | Same ring | Honeypot / rate-limit / reCAPTCHA failures |
| Ingest API | `POST /api/security/ingest` | Optional extra ingest when `CRON_SECRET` or `SECURITY_INGEST_SECRET` is set |
| Ops read | `GET /api/security/events` | Allowlisted operators; serverless memory is best-effort |
| Forms | Honeypot + reCAPTCHA + rate limit | Unchanged path; Chibase contact uses the same guards |
| Firm host isolation | `src/proxy.ts` | Chibase hostname cannot serve `/app`, `/pay`, `/ops`, or product APIs (`/api/paystack`, `/api/trial`, …). Allowed: `/api/contact`, `/api/security/csp-report`, `/api/chibase/pay/*` (consulting checkout only). |

## Operator setup

```bash
# Optional dedicated ingest token (or reuse CRON_SECRET)
SECURITY_INGEST_SECRET=<long random>
# Optional chat/ops webhook (external URL only)
SECURITY_ALERT_WEBHOOK_URL=https://…
```

`GET /api/health` → `launch.securityIngest` is true when a secret exists.

Add `chibaseconsulting.co.za` (and www) to the reCAPTCHA domain list **before** website DNS cutover. Cutover runbook: `docs/CHIBASE_SITE.md` (retire WP; do not import it).

## If you see another “Human Verification / open Terminal / Ctrl+V”

That is **not** this app. Close the tab. It was the compromised WordPress origin. This origin never asks visitors to paste into Terminal.

## Related

- Tenancy ladder: `docs/SECURITY_TENANCY.md` (L2–L5 still apply to **workspace data**)
- Firm cutover: `docs/CHIBASE_SITE.md`
