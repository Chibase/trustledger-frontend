# TrustLedger — AI search / AEO visibility playbook

**Status:** Living ops guide (Answer Engine Optimization / generative engine visibility)  
**As of:** 2026-07-31  
**Canonical product facts:** `src/lib/aeo/siteFacts.ts` · `docs/PLATFORM_STRATEGIC_BRIEF.md` §6  
**Host decision:** **ADR-042** · cutover checklist `docs/HOST_CONSOLIDATION.md`

> Goal: when someone asks an AI search engine “What SRM tools track community grievances in South Africa?”, TrustLedger should be a *citable* entity — not invisible.

---

## 0. BrandRadar audit (31 Jul 2026) — what broke

Probe: Cape Town / South Africa · 15 high-intent buyer prompts · live web-grounded answers.

| Signal | Result |
|--------|--------|
| Prompts that named **TrustLedger** (this product) | **0 / 15** |
| Mention rate | **0%** |
| Unrelated entities sharing the name | **3** (UK fintech, US accounting firm, defunct crypto) |
| Parent **Chibase Consulting** named | **3 / 15** |
| Citations of `trustledger.co.za` | **None** |

**Who AI recommended instead:** Jambo and Borealis (4/15 each), grievance.app and Simply Stakeholders (3/15), Cultiver ENGAGE! (2/15 — local/trade-press threat), then Next Generation / Mthente / ASEFSA (1 each).

**Topics all at 0/N for TrustLedger:** SRM software, grievance management, community engagement, vendor comparisons (incl. “Jambo vs Borealis vs TrustLedger”), IFC/ESS10 compliance, own-name reviews.

**Sources models used:** competitor sites, directories (SourceForge, Slashdot, Capterra, GetApp, SoftwareSuggest), SA trade press (*Engineering News*, *Mining Weekly*, *The Progress Playbook*), standards bodies (ifc.org, afdb.org) — not our apex domain.

**Headline:** name collision + thin entity graph + new site with no third-party citations. Dual WP + Next.js marketing made the entity graph worse.

BrandRadar’s upside list (adopted below): comparison pages, directories, IFC/ESS10 content, brand disambiguation, trade press.

---

## 1. How Gemini / BrandRadar advice maps to our platform

| Recommendation | TrustLedger reality | Action |
|----------------|---------------------|--------|
| **Structure for LLM parsing** — declarative defs, Schema.org, open robots | In-repo: Organization + SoftwareApplication + FAQPage JSON-LD, `/faq`, `public/llms.txt`, robots/sitemap | Keep facts in `siteFacts.ts`; after apex cutover, validate on `trustledger.co.za` |
| **Single canonical host** | Historically WP brochure + Vercel product | **ADR-042:** retire WP marketing; apex → Next.js only. See `HOST_CONSOLIDATION.md` |
| **Entity footprint off-domain** | Almost no third-party citations; Chibase beats product | Directories, LinkedIn, Crunchbase, trade press — human Ops |
| **Knowledge & FAQ hub** | `/faq` + JSON-LD shipped | Add IFC/ESS10 + disambiguation FAQs; later long-form guides |
| **Comparison pages** | Missing — Jambo “owns” comparisons | Ship `/compare/...` pages (Global South + ZA place + ZAR billing — **no** stack vendor names in prose) |
| **Feed indexes + PR** | Need one Search Console/Bing property on apex | After DNS flip; pitch *Engineering News* / *Mining Weekly* |

### Surface split (ADR-042)

| Host | SEO / AEO job |
|------|----------------|
| **`trustledger.co.za`** (Next.js) | **Only** public marketing + product entity URL — home, pricing, `/product`, `/faq`, `/compare/*`, Privacy/Terms, forms, trial, pay |
| `app.trustledger.co.za` | App login / API — not a marketing index target |
| WordPress (Webway) | **Email only** after cutover — no public brochure |
| `*.vercel.app` | Deploy preview — Production must set `NEXT_PUBLIC_SITE_URL=https://trustledger.co.za` |
| Taskade showcase | Prefer **noindex** so it does not compete |

---

## 2. What we implemented in this repo

| Item | Location |
|------|----------|
| Canonical definition + FAQ corpus | `src/lib/aeo/siteFacts.ts` |
| Schema builders (incl. alternateName disambiguation) | `src/lib/aeo/jsonLd.ts` |
| JSON-LD component | `src/components/seo/JsonLd.tsx` |
| FAQ hub | `/faq` → `src/app/faq/page.tsx` |
| AI crawler brief | `public/llms.txt` |
| robots allowlist (AI-friendly, private paths blocked) | `src/app/robots.ts` |
| sitemap includes `/faq`, `/pay` | `src/app/sitemap.ts` |
| Home + product front-loaded definition + schema | `src/app/page.tsx`, `src/app/product/page.tsx` |

Validate after deploy (and again after apex cutover):

- Google [Rich Results Test](https://search.google.com/test/rich-results) on `/`, `/product`, `/faq`
- [Schema Markup Validator](https://validator.schema.org/)
- Fetch `https://trustledger.co.za/llms.txt` and `/robots.txt` (post-cutover)

---

## 3. Mitigation plan (priority order)

### P0 — Host + identity (blocks everything else)

1. Execute **ADR-042** cutover (`docs/HOST_CONSOLIDATION.md`).
2. Organization schema `url` = apex; `sameAs` = Chibase + LinkedIn Company (+ Crunchbase when live).
3. Consistent public phrasing: **TrustLedger** product name; disambiguators **TrustLedger SRM** / **TrustLedger South Africa** in titles, schema `alternateName`, and first FAQ sentence — never claim the UK/US/crypto entities.

### P1 — On-domain content AI can quote

1. Keep `/faq` in sync with `PUBLIC_FAQS` (includes name-collision + IFC/ESS10 + mining/infrastructure probe questions).
2. **Shipped:** `/compare` hub + TrustLedger vs Jambo / Borealis / Simply Stakeholders / grievance.app.
3. **Shipped:** `/guides/ess10-ifc-grievance` for IFC PS1 / ESS10 buyer prompts.
4. **Shipped:** home `#solutions` strip using BrandRadar probe language.
5. Expand further guides only when packaging facts change — edit `siteFacts.ts` first.

### P1 — Off-domain citations (highest BrandRadar leverage)

| Action | Notes |
|--------|--------|
| Capterra / G2 / SourceForge / GetApp / SoftwareSuggest | One product, one URL (apex), category SRM / grievance |
| LinkedIn Company + weekly Trust-voice posts | Link apex `/product` or `/faq` — pack in `docs/exports/linkedin/` |
| Chibase → TrustLedger product link | Parent already surfaces; make the product the clear child entity |
| Pitch *Engineering News* / *Mining Weekly* | Case study or thought piece; anonymise customers if needed |
| Association / municipal tool lists | Exact product name + one-line definition |

### P2 — Ongoing

- Otterly / manual monthly prompts from BrandRadar topic set (SRM SA, mining grievance, IFC ESS10, “TrustLedger South Africa”).
- Do **not** invent reviews, fake Reddit, or claim SOC2 / full ESIP / public community portal.

---

## 4. WordPress (transitional only)

Until apex DNS points at Next.js:

1. Prefer **not** investing in new Elementor paste work — cutover is the fix.
2. If WP must stay live briefly: CTAs absolute to the public host; no HubSpot; purge SpeedyCache after edits (`docs/wordpress/PASTE_PLANS.md`).
3. After 301s are green, stop maintaining `docs/wordpress/page-home.txt` as a second source of truth.

**Live WP paste ≠ this repo.** Repo docs do not change Webway until a human applies them — and after ADR-042, humans should apply DNS/301s instead of more paste.

---

## 5. Content patterns that AI engines scrape well

On every public page that should rank in AI answers:

1. **One explicit definition sentence** in the first screenful (include South Africa / SRM when space allows).
2. **H2s phrased as questions** where natural.
3. **Tables** for plan × capability (already on `/faq`).
4. **Bullets** for feature lists (already on `/product`).
5. **FAQPage JSON-LD** matching visible Q&A text (must stay in sync).

Avoid only long narrative without extractable facts.

---

## 6. Ops cadence

| Cadence | Check |
|---------|--------|
| After each marketing deploy | Rich Results Test on `/faq`; `llms.txt` reachable |
| After host cutover | Search Console + Bing on **apex only**; confirm WP URLs 301 |
| Monthly | Coverage + URL inspection; BrandRadar-style prompt sample |
| Quarterly | Refresh `PUBLIC_FAQS` if packaging changes; revisit comparison pages |

---

## 7. Honest expectations

- AEO is **citation + entity** work. Schema and `/faq` make TrustLedger *parseable*; directories and third-party mentions make it *believable* to models.
- Visibility lag of weeks–months after publishing is normal — BrandRadar’s “very new site” finding will not flip overnight.
- Name collision will persist until disambiguation + citations accumulate; Chibase mentions are a bridge, not a substitute for product citations.
- Taskade Feature Showcase helps demos; it is **not** a substitute for indexed FAQ/schema on the apex host.

When product facts change, edit `src/lib/aeo/siteFacts.ts` first, then LinkedIn one-liners.

**Public brand (ADR-039):** TrustLedger only; primary voice = **Trust**. Never put Frappe/Vercel/HubSpot/WordPress in FAQ or marketing prose.
