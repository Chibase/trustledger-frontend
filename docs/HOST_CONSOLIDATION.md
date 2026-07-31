# Public host consolidation (ADR-042)

**Goal:** one indexed public face for TrustLedger so search engines and AI answer engines stop splitting signals across WordPress and the Next.js app.

| Role | Host | Status after cutover |
|------|------|----------------------|
| Public marketing + product | **`https://trustledger.co.za`** → Next.js (Vercel) | **Canonical** |
| TrustLedger Cloud (app) | `https://app.trustledger.co.za` | Keep (not marketing) |
| Legacy WP / Webway CMS | Former Elementor site | **Retire** after 301s |
| `*.vercel.app` preview | Deployment URL | Internal / fallback only — set apex as `NEXT_PUBLIC_SITE_URL` |

**Retire WordPress marketing. Keep the Next.js site.** Do not retire the product app host.

---

## Why (BrandRadar, 31 Jul 2026)

- TrustLedger named in **0/15** buyer prompts; mention rate **0%**.
- Name collisions (UK fintech, US accounting, defunct crypto) outranked the SA SRM product on its own name.
- Parent Chibase appeared in **3/15**; **`trustledger.co.za` never surfaced** as a citation source.
- Competitors with one strong web entity + directories + trade press won category prompts.

Two editable public homes make that worse: duplicate FAQ, competing sitemaps, and no single Organization `url`.

---

## Ops checklist (human)

### A. Vercel / Next.js (before DNS flip)

- [ ] Add custom domain `trustledger.co.za` (+ `www` → apex or vice versa, pick one).
- [ ] Production env: `NEXT_PUBLIC_SITE_URL=https://trustledger.co.za`.
- [ ] Confirm `/`, `/product`, `/faq`, `/llms.txt`, `/robots.txt`, `/sitemap.xml` on the apex host.
- [ ] Rich Results Test on `/` and `/faq` after flip.
- [ ] Search Console + Bing: property for apex; submit sitemap; optionally mark `*.vercel.app` as non-primary.

### B. Webway / WordPress (cutover sitting)

- [ ] Inventory live WP URLs (home, privacy, terms, assessment, any blog posts).
- [ ] Map each to a Next.js route (or `/`). Ensure Privacy/Terms exist on Next.js before killing WP pages.
- [ ] Install **301 redirects** from every WP path → Next.js equivalent (host-level or plugin). Prefer permanent redirects, not meta refresh.
- [ ] Point DNS A/CNAME for `trustledger.co.za` at Vercel (or reverse-proxy that 301s to Vercel). Remove SpeedyCache as the public origin once redirects prove clean.
- [ ] After 2–4 weeks of clean 301s and Search Console, decommission Elementor content / WP app if unused for email-only hosting.

### C. Entity graph (same week as flip)

- [ ] Chibase site: one clear “Product: TrustLedger” link to `https://trustledger.co.za` (not `*.vercel.app`).
- [ ] LinkedIn Company + Crunchbase (or equivalent): name **TrustLedger**, category **SRM / grievance**, HQ **South Africa**, website = apex.
- [ ] Directory listings (Capterra / G2 / SourceForge / GetApp): one URL only — apex.
- [ ] Do **not** publish a second brochure site after cutover.

### D. Stop doing

- [ ] Re-pasting long Elementor home packs as a parallel marketing source of truth.
- [ ] Submitting two equal sitemaps as “the” brand site.
- [ ] Naming stack vendors (hosting, CMS, payment brand) in public AEO copy (ADR-039).

---

## Repo impact

- Marketing copy and FAQ: `src/lib/aeo/siteFacts.ts`, app routes, not `docs/wordpress/page-home.txt` (kept only as archival / transitional paste).
- CTA guides that assume WP brochure → update links to apex paths after DNS flip (`docs/WORDPRESS_CTA.md`, `docs/WEBWAY_CUTOVER.md` become historical once WP is dark).

Detail playbook: `docs/AEO_VISIBILITY.md`.
