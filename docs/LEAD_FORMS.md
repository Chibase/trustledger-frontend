# Lead forms — spam, feedback, follow-ups

Applies to `/demo`, `/assessment`, soft-gate, and in-app Support tickets.

## 1. Spam control (shipped)

| Layer | Behaviour |
|-------|-----------|
| Work-email allowlist | Rejects common free-mail domains |
| Honeypot (`tl_hp`) | Hidden field; bots that fill it get a fake success (no CRM write). Avoids `company_url` / website names that password managers autofill. |
| Rate limit | ~8 posts / 15 min / IP / route (best-effort on serverless) |
| **reCAPTCHA v3** (optional) | When env keys are set, token verified server-side |

### Enable reCAPTCHA (recommended before public launch)

1. Create a **reCAPTCHA v3** key pair in Google Admin (domains: `trustledger-frontend-pi.vercel.app`, `trustledger.co.za`).
2. Vercel env:
   ```bash
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
   RECAPTCHA_SECRET_KEY=...
   # optional
   RECAPTCHA_MIN_SCORE=0.5
   FORM_REQUIRE_RECAPTCHA=1   # fail closed if keys missing
   ```
3. Redeploy.

Without keys, honeypot + rate limit + work-email still run.

## 2. Required comment / feedback (shipped)

| Form | Required note |
|------|----------------|
| Demo entry | “What do you want to see or solve?” (min 10 chars) |
| Assessment unlock | “What prompted this assessment?” (min 10 chars) |
| Soft gate | Email only (backup; entry already captured intent) |
| Support | Description already required |

Comments are appended into the HubSpot/Frappe message body for sales context.

## 3. Automated follow-up + discount (CRM — not in the Next form)

Do **not** auto-send discounts from the Vercel form. That needs email identity, unsubscribe, and offer control.

**Recommended after Frappe Cloud is stable:**

1. Lead lands in Frappe CRM (or HubSpot until cutover) with source + comment.
2. Email Alert / Newsletter / Notification:
   - Day 0: thank-you + link to demo/assessment summary  
   - Day 2–3: soft offer (e.g. launch week % or fixed pilot credit) **only** if tagged `incentive_eligible`
3. Peach coupon / manual invoice note for the discount — never a public unauthenticated “claim” URL without expiry.

Until Frappe email is ready, send follow-ups manually from HubSpot sequences or your Webway mailbox using the new **Comment** field.

## Privacy

Incentives and marketing follow-ups must match the Privacy Policy consent line already on the forms.
