# Operator sitting — not engineering

This is the leftover from the GO LIVE inspection: **Production env, Google reCAPTCHA, Resend domain, Webway CMS, and Desk SMTP**. None of those can be finished from this repo.

In-repo: `/ops/readiness` **Operator sitting** panel + `GET /api/health` → `launch.operatorSitting`.  
Still sitting after this packet: a human with Vercel / Google / Resend / Webway / Desk logins.

Do **not** treat this file as “done” when the panel exists. Env lane can go green. Operator lane stays sitting until click-smoke, Webway paste, and Desk SMTP are actually done.

---

## What this deploy will not do

| Temptation | Why not |
|------------|---------|
| Fail-closed reCAPTCHA with no keys | Every public lead (`/contact`, `/quote`, `/assessment`, …) would 400 |
| Ignore `ACCESS_EMAIL_VERIFICATION=0` | That is the emergency OTP bypass |
| Rewrite `RESEND_FROM_EMAIL` off `@trustledger.co.za` | Mail can still deliver on the retired apex; current apex must be **verified in Resend** first |
| Edit WordPress / Desk from git | Different hosts (`docs/WEBWAY_CUTOVER.md`, `docs/FRAPPE_EMAIL_MARKETING.md`) |

---

## 1. reCAPTCHA v3 (spam)

1. [Google reCAPTCHA admin](https://www.google.com/recaptcha/admin) → **v3** key.  
   Domains: `trustledger-frontend-pi.vercel.app`, `trustledgersrm.co.za` (optional `localhost`).
2. Vercel → Production → Environment Variables:

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<site key>
RECAPTCHA_SECRET_KEY=<secret>
FORM_REQUIRE_RECAPTCHA=1
RECAPTCHA_MIN_SCORE=0.5
```

3. **Redeploy** Production.
4. Confirm: `GET /api/health` → `launch.recaptcha: true`, `launch.recaptchaFailClosed: true`.

App behaviour: once **both** keys are set, tokens are required even if `FORM_REQUIRE_RECAPTCHA` is unset. Still set `FORM_REQUIRE_RECAPTCHA=1` so missing keys later **reject** forms instead of failing open. Set `FORM_REQUIRE_RECAPTCHA=0` only as an emergency bypass.

Until keys exist: honeypot + work-email + tighter rate limit (3/15 min) still run.

## 2. Access email verification

Resend is already on in Production. Verification stays **off** while `ACCESS_EMAIL_VERIFICATION=0`.

Vercel Production:

1. Delete `ACCESS_EMAIL_VERIFICATION=0`, **or** set `ACCESS_EMAIL_VERIFICATION=1`.
2. Redeploy.
3. Confirm: `launch.accessEmailVerification: true`, `launch.accessVerificationReady: true`, `launch.accessVerificationForcedOff: false`.

Do not leave `=0` on as a convenience. It is the OTP kill switch.

## 3. Resend From → current apex

Target: `RESEND_FROM_EMAIL=TrustLedger <noreply@trustledgersrm.co.za>`  
MX for `trustledgersrm.co.za` **stays Webway**. Resend is send-only (SPF + DKIM). Full steps: `docs/RESEND_PRODUCTION.md`.

1. Resend → Domains → add/verify `trustledgersrm.co.za` (status Verified or send-capable Partially verified).
2. Merge Resend SPF `include:` into the existing SPF TXT. Do not add a second SPF. Do not change MX.
3. Vercel: set the From above. Redeploy.
4. Confirm: `launch.fromUsesLegacyApex: false`, `resendDiag.from` contains `@trustledgersrm.co.za`, `inviteEmailReady: true`.

A working From on `@trustledger.co.za` is **sitting**, not a mail outage. This app will not rewrite that From.

## 4. Production form click-smoke

Canonical inventory: `src/lib/leadFormInventory.ts` (also the Acquisition panel on `/ops/readiness`).

On `https://trustledger-frontend-pi.vercel.app`, submit once each and confirm **CRM Lead** in Desk:

| Form | Path |
|------|------|
| Contact | `/contact` |
| Product feedback | `/contact` (kind=feedback) |
| Quote | `/quote` |
| Assessment unlock | `/assessment` |
| Support ticket | in-app Support (or `/api/support/ticket`) |

Optional: Ops **Write HS-2 smoke lead** (`hs2-smoke@trustledgersrm.co.za`).

## 5. Webway CTA paste

This repo does not edit WordPress. Paste pack: `docs/WEBWAY_CUTOVER.md` + `docs/WORDPRESS_CTA.md`.

Brochure + **absolute** Vercel buttons only. No HubSpot forms.

## 6. Desk SMTP / Email Delivery Service

Runbook: `docs/FRAPPE_EMAIL_MARKETING.md`.

1. Uninstall Frappe Cloud **Email Delivery Service** if it blocks custom SMTP.
2. Desk Email Account `sales@trustledgersrm.co.za` — Webway SMTP **465 SSL**.
3. **Send Test** before any Newsletter.
4. Do **not** blast marketing from Resend OTP / onboarding keys.

---

## Confirm

```bash
curl -sS https://trustledger-frontend-pi.vercel.app/api/health | jq '.launch | {
  recaptcha, recaptchaFailClosed, accessEmailVerification, accessVerificationReady,
  accessVerificationForcedOff, fromUsesLegacyApex, inviteEmailReady,
  operatorSitting: {
    envClear: .operatorSitting.envClear,
    remainingEnv: .operatorSitting.remainingEnv,
    remainingOperator: .operatorSitting.remainingOperator
  }
}'
```

Ops → `/ops/readiness` → **Operator sitting**. Env lane can pass. Operator lane (click-smoke, Webway, Desk) is never auto-green.
