# WordPress CTA → TrustLedger product links

Marketing site: `https://trustledger.co.za`  
Product (Vercel): `https://trustledger-frontend-pi.vercel.app`  
Desk (Frappe Cloud): `https://app.trustledger.co.za`

## Link map

| CTA | URL |
|-----|-----|
| Start trial (capture → guided trial / sample demo) | `https://trustledger-frontend-pi.vercel.app/trial?utm_source=wordpress&utm_medium=cta&utm_campaign=start_trial` |
| Try demo only | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=try_demo` |
| Open dashboard | `https://trustledger-frontend-pi.vercel.app/app/dashboard?utm_source=wordpress&utm_medium=cta&utm_campaign=dashboard` |
| Sign in (live) | `https://trustledger-frontend-pi.vercel.app/login/live?utm_source=wordpress&utm_medium=cta&utm_campaign=live_login` |
| App home | `https://trustledger-frontend-pi.vercel.app/?utm_source=wordpress&utm_medium=cta&utm_campaign=home` |
| SRM assessment (full page) | `https://trustledger-frontend-pi.vercel.app/assessment?utm_source=wordpress&utm_medium=cta&utm_campaign=srm_diagnostic` |
| SRM assessment (embed) | `https://trustledger-frontend-pi.vercel.app/assessment?embed=1&utm_source=wordpress&utm_medium=embed&utm_campaign=srm_diagnostic` |
| Team desk (Frappe) | `https://app.trustledger.co.za` |
| Request quote (any plan) | `https://trustledger-frontend-pi.vercel.app/quote?utm_source=wordpress&utm_medium=cta&utm_campaign=request_quote` |
| Quote Practitioner | `https://trustledger-frontend-pi.vercel.app/quote?plan=practitioner&utm_source=wordpress&utm_medium=cta&utm_campaign=quote_practitioner` |
| Quote Project | `https://trustledger-frontend-pi.vercel.app/quote?plan=project&utm_source=wordpress&utm_medium=cta&utm_campaign=quote_project` |
| Quote Institutional | `https://trustledger-frontend-pi.vercel.app/quote?plan=institutional&utm_source=wordpress&utm_medium=cta&utm_campaign=quote_institutional` |
| Buy Practitioner (Paystack, when live) | `https://trustledger-frontend-pi.vercel.app/pay?plan=practitioner&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_practitioner` |
| Buy Project (Paystack, when live) | `https://trustledger-frontend-pi.vercel.app/pay?plan=project&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_project` |
| Institutional / contact | `https://trustledger-frontend-pi.vercel.app/contact?utm_source=wordpress&utm_medium=cta&utm_campaign=buy_institutional` |
| Contact / Book walkthrough | `https://trustledger-frontend-pi.vercel.app/contact/?utm_source=wordpress&utm_medium=nav&utm_campaign=book_walkthrough` |
| Chibase Consulting | `https://chibaseconsulting.co.za` |
| Email (optional secondary) | `mailto:info@trustledger.co.za` |

**Do not** use relative `/contact` on WordPress — that URL is a 404 search page. Always use the absolute Vercel contact URL above.

## Behaviour notes

- **Open dashboard** → `/app/dashboard`. Guests are redirected to demo/login by middleware.
- **Sign in** → live BFF login against Frappe Cloud (`app.trustledger.co.za`).
- **Team desk** → Frappe desk for internal users (not the public demo).
- **Assessment** → public diagnostic on Vercel. Results unlock after name + work email. Leads go to **HubSpot** via Forms API when `HUBSPOT_PORTAL_ID` / `HUBSPOT_FORM_ID` / `HUBSPOT_REGION` are set (fallback: `ASSESSMENT_WEBHOOK_URL`).
- **Start trial** → Vercel `/trial` → capture details → enter guided trial (`/app/dashboard` sample data). No quote/payment wording on that form; commitment is requested later (contact / ops follow-up).
- **Request quote** → Vercel `/quote` → CRM Lead `Quote Request` (separate path from trial). You send Quotation/Invoice from Desk; confirm EFT in **Ops → Finance**.
- **Buy / Paystack** (optional while KYC finishes) → Vercel `/pay`. Ops Finance is notified; Customer / Plan Owner stay manual (`docs/PAYMENTS_SETUP.md`).

**WordPress action required:** point every “Start trial” button to  
`https://trustledger-frontend-pi.vercel.app/trial?utm_source=wordpress&utm_medium=cta&utm_campaign=start_trial`  
(not `/demo`). Re-paste assessment nav from `docs/wordpress/page-assessment.txt` if needed.

## WordPress Home page (conversion)

**Full-page paste:** replace the Home page Custom HTML with [`docs/wordpress/page-home.txt`](wordpress/page-home.txt).

1. Ensure Additional CSS is the latest [`docs/wordpress/additional-css.css`](wordpress/additional-css.css) (or append [`home-conversion-css-patch.css`](wordpress/home-conversion-css-patch.css)).
2. Pages → Home → paste Custom HTML from `page-home.txt` → Update.
3. Purge SpeedyCache → hard refresh `https://trustledger.co.za/`.

Primary CTA: **Run 2-minute live walkthrough** → Vercel `/demo`.  
Admin login is a utility link (not a competing CTA).

**Contact fix (if footer still opens mail/search):** replace every footer Contact `mailto:info@trustledger.co.za` with the Contact URL in the link map, or re-paste full `page-home.txt`. Purge SpeedyCache after.

## WordPress Assessment page

**Prefer full-page paste:** replace the Assessment page Custom HTML with [`docs/wordpress/page-assessment.txt`](wordpress/page-assessment.txt) (includes the live quiz iframe + HubSpot-backed lead gate on Vercel).

Embed-only snippet (if you only swap the placeholder): [`docs/wordpress/assessment-embed.html`](wordpress/assessment-embed.html).

Purge SpeedyCache after paste.
