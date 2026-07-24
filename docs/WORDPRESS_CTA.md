# WordPress CTA → TrustLedger product links

Marketing site: `https://trustledger.co.za`  
Product (Vercel): `https://trustledger-frontend-pi.vercel.app`

## Primary journeys

| CTA | URL | Behaviour |
|-----|-----|-----------|
| **Start 14-day trial** | `https://trustledger-frontend-pi.vercel.app/trial` (optional `?plan=practitioner\|project`) | Own-data workspace. Upgrade → `/pay`. |
| **Subscribe Practitioner** | `…/pay?plan=practitioner` | Paystack checkout |
| **Subscribe Project** | `…/pay?plan=project` | Paystack checkout |
| Institutional / Talk to sales | `https://trustledger-frontend-pi.vercel.app/contact?utm_source=wordpress&utm_medium=cta&utm_campaign=buy_institutional` | Sales-led → Vercel branded form → Frappe CRM Lead |
| Contact / Book walkthrough | `https://trustledger-frontend-pi.vercel.app/contact/?utm_source=wordpress&utm_medium=nav&utm_campaign=book_walkthrough` | Same form |
| Product onboarding | `…/product` | Feature purpose (ADR-033); `/demo` redirects here |

**Do not** use relative `/contact` on WordPress — that becomes a 404 search page. Always use the absolute Vercel contact URL. Prefer Contact over `mailto:` in nav/footer so leads land in CRM.

## Trial rules (product)

- 14 days full access on **your** data (browser workspace today; Frappe tenancy next).
- **Upgrade** in-app → Paystack plans (no subscribe form maze).
- After day 14: **access off**; data retained **90 days**; then purged.
- `/demo` is **not** the trial (redirects to `/product`).

## Paste on Webway

See `docs/wordpress/PASTE_PLANS.md`. After each CTA change, paste `page-home.txt` (and Assessment if live), then purge SpeedyCache.

**Contact fix (if footer still opens mail/search):** replace every footer/nav Contact `mailto:info@trustledger.co.za` (or relative `/contact`) with the absolute Contact URL above, or re-paste full `page-home.txt`. Purge SpeedyCache after.
