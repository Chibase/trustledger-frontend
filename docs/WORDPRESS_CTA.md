# WordPress CTA → TrustLedger product links

Marketing site: `https://trustledger.co.za`  
Product (Vercel): `https://trustledger-frontend-pi.vercel.app`

## Primary journeys

| CTA | URL | Behaviour |
|-----|-----|-----------|
| **Start 14-day trial** | `…/trial` or `…/trial?plan=practitioner\|project` | Own-data workspace (not sample demo). Upgrade → `/pay`. |
| **Subscribe Practitioner** | `…/pay?plan=practitioner` | Paystack checkout |
| **Subscribe Project** | `…/pay?plan=project` | Paystack checkout |
| Institutional | `…/contact` | Sales-led |
| Sample preview only | `…/demo` | Fictional data walkthrough (secondary) |

## Trial rules (product)

- 14 days full access on **your** data (browser workspace today; Frappe tenancy next).
- **Upgrade** in-app → Paystack plans (no subscribe form maze).
- After day 14: **access off**; data retained **90 days**; then purged.
- `/demo` is **not** the trial.

## Paste on Webway

See `docs/wordpress/PASTE_PLANS.md`. After each CTA change, paste `page-home.txt` (and Assessment if live), then purge SpeedyCache.
