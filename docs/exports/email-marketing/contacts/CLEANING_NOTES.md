# HubSpot contact clean — 2026-07-24 (updated 2026-08-10)

Source: HubSpot export `hubspot-crm-exports-all-contacts-2026-07-24.csv` (**83** rows), also stored on Cloud as `/private/files/hubspot-crm-exports-all-contacts-2026-07-24.csv`.

| Bucket | Count | File / Cloud target |
|--------|------:|---------------------|
| **Keep → Email Group `TL Warm Contacts`** | 21 | `TL_Warm_Contacts_email_group_member.csv` (**imported**) |
| **Full export → Email Group `TL HubSpot Import`** | 83 | `TL_HubSpot_Import_email_group_member.csv` (**imported**) |
| Excluded (spam/vendor/internal) | 60 | `hubspot_export_excluded.csv` — in archive group only, not CRM |
| Review (borderline) | 2 | `hubspot_export_review.csv` — in CRM + warm/review CRM file |
| CRM Lead (warm + review) | 23 | Source `HubSpot Import` (**imported**) |

## Keep (ICP)

SA architecture / construction / infrastructure / municipal / DPW / CPUT and related `.co.za` work emails.

## Excluded

Quora spaces, SaaS cold outreach (Riverside, Lindo, Elicit, Patchstack, Taskade, …), car-hire/spice/Bing/Trustpilot/Stripe noise, `info@mysite.com`, internal Chibase (`admin@`, `thozi@`).

## Review

- `info@mamasedivineholdings.com` — uncertain_company_fit
- `pinoy.pride8791@gmail.com` — uncertain_personal_gmail

## Mapping fix (why Desk Import stuck)

The pending Desk job used DocType **Lead** with HubSpot status/owner/industry values. That is the wrong DocType and wrong maps — see `DESK_IMPORT_STEPS.md`.

Correct path for blasts: **Email Group Member** with only `email_group` + `email`.

## Import + send

Cloud lists are already populated (2026-08-10). Next:

1. Confirm **Email Account** outgoing (`docs/exports/email-marketing/DESK_EMAIL_ACCOUNT_SALES.md`).
2. **Newsletter** → Email Group **`TL Warm Contacts`** → `../01-soft-launch.html`.
3. Send test to yourself → then send to the group.

See `docs/FRAPPE_EMAIL_MARKETING.md`.
