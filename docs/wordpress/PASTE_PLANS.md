# Paste plan links on WordPress (Webway) — RETIRED

> **Retired 2026-08-10.** Marketing is Vercel-only at `https://trustledger.co.za`.  
> Do not paste these packs to revive a WordPress brochure. See `docs/WEBWAY_CUTOVER.md`.

Archive only. Historical HubSpot cutover: `docs/WEBWAY_CUTOVER.md` (ADR-034).

## Link map

| Plan | Subscribe | Trial |
|------|-----------|-------|
| Solo | `/pay?plan=solo` | `/trial?plan=solo` |
| Practitioner | `/pay?plan=practitioner` | `/trial?plan=practitioner` |
| Project | `/pay?plan=project` | `/trial?plan=project` |
| Institutional | `/contact` (sales) | — |

Full host: `https://trustledger-frontend-pi.vercel.app`

Never put Paystack secret/public keys in WordPress.

## Steps on Webway

1. Open `docs/wordpress/page-home.txt` in this repo (GitHub or local).
2. WordPress → **Pages → Home** → edit Custom HTML (or Elementor HTML) block.
3. Replace the **entire** block with the file contents.
4. **Update / Publish**.
5. Repeat for **Assessment** using `docs/wordpress/page-assessment.txt` if that page is live.
6. Purge **SpeedyCache** (or host cache).
7. Smoke-test on `https://trustledger.co.za/#pricing`:
   - Solo Subscribe → Paystack checkout for Solo (R1,999)
   - Practitioner Subscribe → Paystack checkout for Practitioner
   - Project Subscribe → Paystack checkout for Project
   - Trial links → `/trial` with plan pre-selected
   - Institutional → contact / sales
   - Foldable Compare plans sections expand
   - Privacy layer CTAs → Contact with `extras=` prefill
   - **Product** in top nav → Vercel `/product`
8. Smoke-test AEO on `https://trustledger.co.za/#faq`:
   - Hero states TrustLedger is SRM software (declarative definition)
   - How it works / final CTA say **own-data trial** (no “sample data / no login”)
   - FAQ answers What is TrustLedger / SRM / AI Assist / municipalities
   - Links to Vercel `/faq`, `/product`, `/trial`
   - View source: JSON-LD `@graph` present, **or** schema added in Yoast/Rank Math
9. Search Console: submit WP sitemap; Bing Webmaster for `trustledger.co.za`

## Source files

- `docs/wordpress/page-home.txt` — pricing cards + CTAs + data-protection blurb + foldable Compare plans + optional privacy layers + **AEO FAQ / definition / JSON-LD**
- `docs/wordpress/faq-aeo-snippet.txt` — minimal FAQ hub link (superseded by full FAQ in `page-home.txt`)
- `docs/wordpress/home-conversion-css-patch.css` — append for comparison table styles
- `docs/wordpress/page-assessment.txt` — nav / footer CTAs
- `docs/AEO_VISIBILITY.md` — AI-search playbook
- `docs/WORDPRESS_CTA.md` — journey table
- `docs/SOLO_PLAN.md` — Solo packaging (ADR-035)
