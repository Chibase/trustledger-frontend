# TrustLedger — AI search / AEO visibility playbook

**Status:** Living ops guide (Answer Engine Optimization / generative engine visibility)  
**As of:** 2026-08-10  
**Canonical product facts:** `src/lib/aeo/siteFacts.ts` · `docs/PLATFORM_STRATEGIC_BRIEF.md` §6  

> Goal: when someone asks an AI search engine “What SRM tools track community grievances in South Africa?”, TrustLedger should be a *citable* entity — not invisible.

---

## 1. How Gemini’s advice maps to our platform

| Gemini recommendation | TrustLedger reality | Action |
|----------------------|---------------------|--------|
| **1. Structure for LLM parsing** — declarative defs, Schema.org, open robots | Marketing + product UI consolidated on Vercel at `trustledger.co.za` | **Shipped:** Organization + SoftwareApplication + FAQPage JSON-LD, `/faq`, `/privacy`, `/terms`, `llms.txt`, robots/sitemap, niche titles, disambiguation |
| **2. Entity footprint off-domain** | Brand entity URL is `trustledger.co.za`; almost no third-party citations yet | **Ops / human:** directories, LinkedIn, industry associations, Reddit/civic-tech threads |
| **3. Knowledge & FAQ hub** | `/faq` is the public FAQ; WordPress mirror retired | Keep `PUBLIC_FAQS` in sync with visible `/faq` copy |
| **4. Feed indexes + PR** | One public marketing host | **Ops:** Search Console + Bing on `trustledger.co.za` only; submit `/sitemap.xml`; LinkedIn/case studies |

### Surface split (do not blur)

| Host | SEO / AEO job |
|------|----------------|
| `trustledger.co.za` (Vercel) | **Sole** public marketing + product UI — home, pricing, `/product`, `/faq`, `/privacy`, `/terms`, assessment, trial/pay, `llms.txt`, Organization `url` |
| `trustledger-frontend-pi.vercel.app` | Legacy deploy host — **308 redirect** to apex (`vercel.json`); do not cite in emails or schema |
| Taskade showcase | Optional product tour — prefer **noindex** so it does not compete with the apex |
| `app.trustledger.co.za` | App login / Cloud — not a marketing index target |

---

## 2. What we implemented in this repo

| Item | Location |
|------|----------|
| Canonical definition + FAQ corpus | `src/lib/aeo/siteFacts.ts` |
| Disambiguation (not crypto / not generic ledger) | `PRODUCT_DISAMBIGUATION` + FAQ + `llms.txt` |
| Niche titles (SRM + South Africa) | `PRODUCT_TITLE_DEFAULT` · home / product / FAQ metadata |
| Schema builders | `src/lib/aeo/jsonLd.ts` (`disambiguatingDescription`, `knowsAbout`, `alternateName`) |
| JSON-LD component | `src/components/seo/JsonLd.tsx` |
| FAQ hub | `/faq` → `src/app/faq/page.tsx` |
| AI crawler brief | `public/llms.txt` |
| robots allowlist (AI-friendly, private paths blocked) | `src/app/robots.ts` |
| sitemap includes `/faq`, `/pay`, `/privacy`, `/terms` | `src/app/sitemap.ts` |
| Home + product front-loaded definition + schema | `src/app/page.tsx`, `src/app/product/page.tsx` |
| Legal pages (Webway privacy/terms replacement) | `/privacy`, `/terms` |
| Apex canonical + legacy host redirect | `SITE_URL` default + `vercel.json` 308 |
| Stale “Demo” OG copy removed | `src/app/layout.tsx` |

Validate after deploy:

- Google [Rich Results Test](https://search.google.com/test/rich-results) on `https://trustledger.co.za/`, `/product`, `/faq`
- [Schema Markup Validator](https://validator.schema.org/)
- Fetch `https://trustledger.co.za/llms.txt` and `/robots.txt`
- Confirm `https://trustledger-frontend-pi.vercel.app/` → 308 to apex

### 2a. Canonical host (Vercel-only marketing)

| Layer | Action |
|-------|--------|
| `NEXT_PUBLIC_SITE_URL` | Production value: `https://trustledger.co.za` (code fallback matches). |
| Organization `url` | `https://trustledger.co.za` |
| Legacy `*.vercel.app` | Permanent redirect to apex; keep in Frappe CORS allowlist until traffic dies. |
| Email / LinkedIn CTAs | Absolute `https://trustledger.co.za/...` only |
| Search Console / Bing | Property for apex; submit `https://trustledger.co.za/sitemap.xml` |

WordPress on Webway is **retired** for TrustLedger marketing (see `docs/WEBWAY_CUTOVER.md`). Mailboxes may still live on Webway DNS/mail.

---

## 4. Entity footprint (off-domain — prioritised)

Do these outside the frontend repo; they matter more for Perplexity/ChatGPT than another on-site paragraph.

| Priority | Action | Notes |
|----------|--------|-------|
| P0 | LinkedIn Company + founder posts naming **TrustLedger** + SRM + South Africa | Weekly cadence; link to `/product` or `/faq` |
| P0 | Google Business / org listings if applicable; ensure Chibase site links to TrustLedger | Entity graph |
| P1 | List in SaaS / civic-tech / ESG directories (Capterra, Product Hunt when ready, African tech roundups, municipal tool lists) | Exact product name + one-line definition |
| P1 | Publish 1–2 thought-leadership pieces (Medium / association sites) on grievance desks or IKS/community trust — cite TrustLedger as the product | Gemini’s “scholarly” angle; stay factual, no over-claim V003 |
| P2 | Earn Reddit / forum mentions in civic-tech, ESG, SA municipal threads | Helpful answers > spam |
| P2 | PR / case study (anonymised if needed) once a live customer allows | Strongest AI citation fuel |

**Do not:** invent reviews, fake Reddit accounts, or claim SOC2 / full ESIP / public community portal.

---

## 5. Content patterns that AI engines scrape well

On every public page that should rank in AI answers:

1. **One explicit definition sentence** in the first screenful.
2. **H2s phrased as questions** where natural (“How does AI Assist work?”).
3. **Tables** for plan × capability (already on `/faq`).
4. **Bullets** for feature lists (already on `/product`).
5. **FAQPage JSON-LD** matching visible Q&A text (must stay in sync).

Avoid only long narrative without extractable facts.

---

## 6. Ops cadence

| Cadence | Check |
|---------|--------|
| After each marketing deploy | Rich Results Test on `/faq`; `llms.txt` reachable on apex |
| Monthly | Search Console coverage for `trustledger.co.za`; Bing URL inspection |
| Monthly | Otterly / manual prompts: “SRM software South Africa”, “community grievance tracking tool”, “Stakeholder Relationship Management infrastructure” |
| Quarterly | Refresh `PUBLIC_FAQS` if packaging or versions change |

---

## 7. Honest expectations

- AEO is **citation + entity** work. Schema and `/faq` make TrustLedger *parseable*; directories and third-party mentions make it *believable* to models.
- Visibility lag of weeks–months after publishing is normal.
- Taskade Feature Showcase helps demos; it is **not** a substitute for indexed FAQ/schema on `trustledger.co.za`.

When product facts change, edit `src/lib/aeo/siteFacts.ts` first, then LinkedIn one-liners.

**Public brand (ADR-039):** TrustLedger only; primary voice = **Trust**. Never put Frappe/Vercel/HubSpot in FAQ or marketing prose.
