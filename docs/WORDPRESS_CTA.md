# WordPress CTA → TrustLedger product links

Marketing site: `https://trustledger.co.za`  
Product (Vercel): `https://trustledger-frontend-pi.vercel.app`  
Desk (Interserv): `https://app.trustledger.co.za`

## Link map

| CTA | URL |
|-----|-----|
| Try demo / 14-day trial | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=try_demo` |
| Open dashboard | `https://trustledger-frontend-pi.vercel.app/app/dashboard?utm_source=wordpress&utm_medium=cta&utm_campaign=dashboard` |
| Sign in (live) | `https://trustledger-frontend-pi.vercel.app/login/live?utm_source=wordpress&utm_medium=cta&utm_campaign=live_login` |
| App home | `https://trustledger-frontend-pi.vercel.app/?utm_source=wordpress&utm_medium=cta&utm_campaign=home` |
| SRM assessment (full page) | `https://trustledger-frontend-pi.vercel.app/assessment?utm_source=wordpress&utm_medium=cta&utm_campaign=srm_diagnostic` |
| SRM assessment (embed) | `https://trustledger-frontend-pi.vercel.app/assessment?embed=1&utm_source=wordpress&utm_medium=embed&utm_campaign=srm_diagnostic` |
| Team desk (Frappe) | `https://app.trustledger.co.za` |
| Chibase Consulting | `https://chibaseconsulting.co.za` |
| Contact | `mailto:info@trustledger.co.za` |

## Behaviour notes

- **Open dashboard** → `/app/dashboard`. Guests are redirected to demo/login by middleware.
- **Sign in** → live BFF login against Interserv.
- **Team desk** → Frappe desk for internal users (not the public demo).
- **Assessment** → public diagnostic on Vercel. Results unlock after name + work email. Optional `ASSESSMENT_WEBHOOK_URL` receives the lead payload.

## WordPress Assessment page embed

Replace the placeholder on `/assessment/` with the HTML in [`docs/wordpress/assessment-embed.html`](wordpress/assessment-embed.html) (Custom HTML block). Purge SpeedyCache after paste.
