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
| Team desk (Frappe) | `https://app.trustledger.co.za` |
| Chibase Consulting | `https://chibaseconsulting.co.za` |
| Contact | `mailto:info@trustledger.co.za` |

## Behaviour notes

- **Open dashboard** → `/app/dashboard`. Guests are redirected to demo/login by middleware.
- **Sign in** → live BFF login against Interserv.
- **Team desk** → Frappe desk for internal users (not the public demo).

Paste files under `accordbridge-marketing/wordpress/` already use this map in nav/footer CTAs. Re-paste pages after pulling updates, or edit links in WP to match the table above.
