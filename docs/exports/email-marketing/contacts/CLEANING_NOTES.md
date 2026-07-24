# HubSpot contact clean — 2026-07-24

Source: HubSpot export `hubspot-crm-exports-all-contacts-2026-07-24.csv` (**83** rows).

| Bucket | Count | File |
|--------|------:|------|
| **Keep → Email Group `TL Warm Contacts`** | 21 | `TL_Warm_Contacts_email_group.csv` |
| Excluded (spam/vendor/internal) | 60 | `hubspot_export_excluded.csv` |
| Review (borderline — do not blast yet) | 2 | `hubspot_export_review.csv` |

## Keep (ICP)
SA architecture / construction / infrastructure / municipal / DPW / CPUT and related `.co.za` work emails.

## Excluded
Quora spaces, SaaS cold outreach (Riverside, Lindo, Elicit, Patchstack, Taskade, …), car-hire/spice/Bing/Trustpilot/Stripe noise, `info@mysite.com`, internal Chibase (`admin@`, `thozi@`).

## Review
- `info@mamasedivineholdings.com` — uncertain_company_fit
- `pinoy.pride8791@gmail.com` — uncertain_personal_gmail

## Import + send (Desk — you)
This cloud agent **cannot** log into Frappe Email Account or SMTP (no secrets in env).

1. `app.trustledger.co.za` → **Email Domain** + **Email Account** for your from-address (e.g. `info@trustledger.co.za` / `hello@…`) with SPF/DKIM on Webway.
2. **Email Group** → New → `TL Warm Contacts` → import/add from `TL_Warm_Contacts_email_group.csv`.
3. **Email Template** / Newsletter → paste `../01-soft-launch.html`.
4. Send test to **yourself** → then send to the group.

See `docs/FRAPPE_EMAIL_MARKETING.md`.
