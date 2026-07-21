# Paste plan links on WordPress (Webway)

Repo paste files already point at Vercel Paystack + trial. **Live WP does not update until you paste.**

## Link map

| Plan | Subscribe | Trial |
|------|-----------|-------|
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
   - Practitioner Subscribe → Paystack checkout for Practitioner
   - Project Subscribe → Paystack checkout for Project
   - Trial links → `/trial` with plan pre-selected
   - Institutional → contact / sales

## Source files

- `docs/wordpress/page-home.txt` — pricing cards + CTAs
- `docs/wordpress/page-assessment.txt` — nav / footer CTAs
- `docs/WORDPRESS_CTA.md` — journey table
