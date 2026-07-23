# Lead forms — spam, feedback, follow-ups

Applies to `/assessment`, `/contact`, `/quote`, soft-gate, product feedback, and in-app Support tickets.

## 1. Spam control (shipped)

| Layer | Behaviour |
|-------|-----------|
| Work-email allowlist | Rejects common free-mail domains |
| Honeypot (`tl_hp`) | Hidden field; bots that fill it get a fake success (no CRM write). Avoids `company_url` / website names that password managers autofill. |
| Rate limit | ~8 posts / 15 min / IP / route when reCAPTCHA is on; **~3 / 15 min** when keys are missing (best-effort on serverless) |
| **reCAPTCHA v3** | When env keys are set, token verified server-side on every public form |

### Turn on reCAPTCHA (required before traffic rises)

1. Create a **reCAPTCHA v3** key pair in [Google Admin](https://www.google.com/recaptcha/admin)  
   Domains: `trustledger-frontend-pi.vercel.app`, `trustledger.co.za`, `localhost` (for local).
2. Vercel → Project → Settings → Environment Variables → **Production** (and Preview if useful):
   ```bash
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=…
   RECAPTCHA_SECRET_KEY=…
   RECAPTCHA_MIN_SCORE=0.5
   FORM_REQUIRE_RECAPTCHA=1   # fail closed if keys ever missing
   ```
3. Redeploy Production.
4. Confirm: `GET /api/health` → `launch.recaptcha: true` and `launch.recaptchaFailClosed: true`  
   Ops `/ops/readiness` → reCAPTCHA gate **pass** · First-days hardening green.

Without keys, honeypot + tighter rate limit + work-email still run, but spam protection is incomplete.

## 2. Required comment / feedback (shipped)

| Form | Required note |
|------|----------------|
| Assessment unlock | “What prompted this assessment?” (min 10 chars) |
| Contact (`/contact`) | Message (min 10 chars) → CRM Lead `contact` |
| Quote (`/quote`) | Message → CRM Lead |
| Product feedback | Rating 1–5 + note (min 10 chars) → CRM Lead `product_feedback` |
| Support | Description already required |

Comments are appended into the CRM message body for sales context.

**Where feedback appears:** assessment results screen; demo shell sidebar **Feedback** (desktop + mobile).

**CRM viewing:** each submission sets **Job Title** (e.g. `Feedback · 4/5 · /assessment`) + **Source**, and stores the full note on the lead Comment. Setup + saved filters: `docs/CRM_VIEWS.md`.

## 3. Automated follow-up + discount (CRM — not in the Next form)

Do **not** auto-send discounts from the Vercel form. That needs email identity, unsubscribe, and offer control.

**Recommended (Frappe CRM Lead SoT — ADR-034):**

1. Lead lands in Frappe CRM with source + comment (`docs/HS_CUTOVER.md`).
2. Email Alert / Newsletter / Notification:
   - Day 0: thank-you + link to demo/assessment summary  
   - Day 2–3: soft offer (e.g. launch week % or fixed pilot credit) **only** if tagged `incentive_eligible`
3. Paystack / manual invoice note for the discount — never a public unauthenticated “claim” URL without expiry.

Until Frappe email alerts are ready, send follow-ups manually from your Webway mailbox using the **Comment** field (not HubSpot sequences).

## Privacy

Incentives and marketing follow-ups must match the Privacy Policy consent line already on the forms. Forms show Google reCAPTCHA attribution when keys are configured.
