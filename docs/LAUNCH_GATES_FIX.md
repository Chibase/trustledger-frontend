# Fix Ops readiness: reCAPTCHA + access email verification

Production health (2026-07-24) showed:

| Signal | Value | Meaning |
|--------|--------|---------|
| `launch.recaptcha` | `false` | No Google reCAPTCHA keys on Vercel |
| `launch.accessEmailVerification` | `false` | Explicitly off (`ACCESS_EMAIL_VERIFICATION=0`) **or** Resend not usable |
| `launch.resendDiag.keyLength` | **3** | `RESEND_API_KEY` is truncated to `re_` — not a real secret |
| `launch.resendAuthOk` | `false` | Resend rejects the stub key |

## 1. Fix Resend (required for access-verify gate)

1. Resend → API Keys → **Create** (or copy full secret once).
2. Vercel → Production → `RESEND_API_KEY` = full value starting with `re_` (dozens of characters — **not** just `re_`).
3. `RESEND_FROM_EMAIL` = `TrustLedger <noreply@trustledger.co.za>` after the domain is **verified** in Resend (never leave Production on `onboarding@resend.dev` if invitees must receive mail). See `docs/RESEND_PRODUCTION.md`.
4. Remove `ACCESS_EMAIL_VERIFICATION=0` **or** set `ACCESS_EMAIL_VERIFICATION=1`.
5. **Redeploy** Production.
6. Check `GET /api/health` → `resendAuthOk: true`, `inviteEmailReady: true`, `accessEmailVerification: true` (when verification is enabled).

Never paste the key in chat.

## 2. Fix reCAPTCHA (form spam gate)

1. [Google reCAPTCHA admin](https://www.google.com/recaptcha/admin) → Create **v3** key.  
   Domains: `trustledger-frontend-pi.vercel.app`, `trustledger.co.za`, `localhost`.
2. Vercel → Production:
   ```bash
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=…
   RECAPTCHA_SECRET_KEY=…
   RECAPTCHA_MIN_SCORE=0.5
   FORM_REQUIRE_RECAPTCHA=1
   ```
3. Redeploy.
4. Health → `recaptcha: true`, `recaptchaFailClosed: true`.

See also `docs/LEAD_FORMS.md`.

## 3. Confirm

Ops → `/ops/readiness` → both gates **pass**.
