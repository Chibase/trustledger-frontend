# WordPress CTA → TrustLedger product links

Marketing site: `https://trustledger.co.za`  
Product (Vercel): `https://trustledger-frontend-pi.vercel.app`  
Desk (Frappe Cloud): `https://app.trustledger.co.za`

## Link map

| CTA | URL |
|-----|-----|
| Start trial (capture → demo **or** subscribe) | `https://trustledger-frontend-pi.vercel.app/trial?utm_source=wordpress&utm_medium=cta&utm_campaign=start_trial` |
| Try demo only | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=try_demo` |
| Open dashboard | `https://trustledger-frontend-pi.vercel.app/app/dashboard?utm_source=wordpress&utm_medium=cta&utm_campaign=dashboard` |
| Sign in (live) | `https://trustledger-frontend-pi.vercel.app/login/live?utm_source=wordpress&utm_medium=cta&utm_campaign=live_login` |
| App home | `https://trustledger-frontend-pi.vercel.app/?utm_source=wordpress&utm_medium=cta&utm_campaign=home` |
| SRM assessment (full page) | `https://trustledger-frontend-pi.vercel.app/assessment?utm_source=wordpress&utm_medium=cta&utm_campaign=srm_diagnostic` |
| SRM assessment (embed) | `https://trustledger-frontend-pi.vercel.app/assessment?embed=1&utm_source=wordpress&utm_medium=embed&utm_campaign=srm_diagnostic` |
| Team desk (Frappe) | `https://app.trustledger.co.za` |
| Buy Practitioner | `https://trustledger-frontend-pi.vercel.app/pay?plan=practitioner&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_practitioner` |
| Buy Project | `https://trustledger-frontend-pi.vercel.app/pay?plan=project&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_project` |
| Institutional / contact | `https://trustledger-frontend-pi.vercel.app/contact?utm_source=wordpress&utm_medium=cta&utm_campaign=buy_institutional` |

| Chibase Consulting | `https://chibaseconsulting.co.za` |
| Contact | `mailto:info@trustledger.co.za` |

## Behaviour notes

- **Open dashboard** → `/app/dashboard`. Guests are redirected to demo/login by middleware.
- **Sign in** → live BFF login against Frappe Cloud (`app.trustledger.co.za`).
- **Team desk** → Frappe desk for internal users (not the public demo).
- **Assessment** → public diagnostic on Vercel. Results unlock after name + work email. Leads go to **HubSpot** via Forms API when `HUBSPOT_PORTAL_ID` / `HUBSPOT_FORM_ID` / `HUBSPOT_REGION` are set (fallback: `ASSESSMENT_WEBHOOK_URL`).
- **Start trial** → Vercel `/trial` → capture details → **Explore demo** or **Subscribe** (Paystack).
- **Buy / Subscribe** → Vercel `/pay` → Paystack. Ops Finance is notified; you update CRM Customer manually (`docs/PAYMENTS_SETUP.md` §D).

**WordPress action required:** point every “Start trial” button to  
`https://trustledger-frontend-pi.vercel.app/trial?utm_source=wordpress&utm_medium=cta&utm_campaign=start_trial`  
(not `/demo`). Re-paste assessment nav from `docs/wordpress/page-assessment.txt` if needed.

## WordPress Assessment page

**Prefer full-page paste:** replace the Assessment page Custom HTML with [`docs/wordpress/page-assessment.txt`](wordpress/page-assessment.txt) (includes the live quiz iframe + HubSpot-backed lead gate on Vercel).

Embed-only snippet (if you only swap the placeholder): [`docs/wordpress/assessment-embed.html`](wordpress/assessment-embed.html).

Purge SpeedyCache after paste.
