# HUMAN ONLY — close BrandRadar AEO gap (ADR-042)

Repo work ships content and schema. These steps need your Webway / DNS / accounts access.

**Checked from this environment (31 Jul 2026):** apex `https://trustledger.co.za/` still serves **WordPress (Apache)**, not the Vercel Next.js app. `https://trustledger-frontend-pi.vercel.app/` is the live product/marketing build. Adding the domain in the Vercel UI is not enough until DNS for the apex (and www) points at Vercel.

---

## 1. DNS — make apex = Next.js (blocking)

- [ ] In Webway / DNS host: point **`trustledger.co.za`** and **`www`** at Vercel (A/ALIAS/CNAME per Vercel domain docs). Remove or override the Apache/Webway web A records that still serve WP.
- [ ] Confirm: `curl -sI https://trustledger.co.za` shows **`server: Vercel`** (not Apache) and the TrustLedger home (not WP “Social Relations management Portal”).
- [ ] Keep WP reachable only on a **non-public** host if you still need it for **email** (e.g. mail panel / webmail) — do **not** leave the public brochure on WP.
- [ ] Vercel Production env: `NEXT_PUBLIC_SITE_URL=https://trustledger.co.za` → redeploy.
- [ ] After flip: open `/`, `/faq`, `/compare`, `/guides/ess10-ifc-grievance`, `/privacy`, `/terms`, `/llms.txt`, `/sitemap.xml`.

## 2. Search & AI indexes

- [ ] Google Search Console: property for `https://trustledger.co.za` → submit `https://trustledger.co.za/sitemap.xml`.
- [ ] Bing Webmaster Tools: same (ChatGPT Search leans on Bing).
- [ ] Rich Results Test on `/` and `/faq` after the DNS flip.
- [ ] Optional: remove or de-emphasise any old WP sitemap still submitted.

## 3. Directories (BrandRadar P1)

One product name, one URL (`https://trustledger.co.za`), category **SRM / grievance / stakeholder engagement**, HQ **South Africa**:

- [ ] Capterra
- [ ] G2
- [ ] SourceForge (“Best SRM Software in Africa” / mining lists if available)
- [ ] GetApp / SoftwareSuggest / Slashdot listings as capacity allows

## 4. Entity graph

- [ ] LinkedIn Company: TrustLedger, website = apex, about text uses **TrustLedger SRM** / South Africa / Chibase as operator only.
- [ ] Crunchbase (or equivalent) organization record → apex.
- [ ] Chibase site: clear “Product: TrustLedger” link to `https://trustledger.co.za` (not `*.vercel.app`).
- [ ] Weekly LinkedIn posts from `docs/exports/linkedin/` linking apex `/product`, `/faq`, `/compare`.

## 5. Trade press

- [ ] Pitch *Engineering News* and *Mining Weekly* (launch / municipal or mining grievance desk angle). Cultiver ENGAGE! surfaced locally via trade press — match that citation type.

## 6. Legal copy review (optional but wise)

- [ ] Counsel glance at new `/privacy` and `/terms` on Next.js (operational summaries shipped so WP legal URLs are not required after cutover).

## 7. Do not

- [ ] Rebuild a public marketing homepage on WordPress.
- [ ] List two different public URLs on directories.
- [ ] Name stack vendors (hosting/CMS) in public posts.

Playbook: `docs/AEO_VISIBILITY.md` · Cutover: `docs/HOST_CONSOLIDATION.md`.
