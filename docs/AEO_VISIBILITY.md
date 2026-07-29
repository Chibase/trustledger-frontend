# TrustLedger — AI search / AEO visibility playbook

**Status:** Living ops guide (Answer Engine Optimization / generative engine visibility)  
**As of:** 2026-07-29  
**Canonical product facts:** `src/lib/aeo/siteFacts.ts` · `docs/PLATFORM_STRATEGIC_BRIEF.md` §6  

> Goal: when someone asks an AI search engine “What SRM tools track community grievances in South Africa?”, TrustLedger should be a *citable* entity — not invisible.

---

## 1. How Gemini’s advice maps to our platform

| Gemini recommendation | TrustLedger reality | Action |
|----------------------|---------------------|--------|
| **1. Structure for LLM parsing** — declarative defs, Schema.org, open robots | Vercel had robots/sitemap/OG (Packet 21) but **no JSON-LD**; home FAQ was a stub; root OG still said “Demo” | **Shipped in-repo:** Organization + SoftwareApplication + FAQPage JSON-LD, `/faq` hub, `public/llms.txt`, robots/sitemap updates, declarative product definition |
| **2. Entity footprint off-domain** | Brand lives on `trustledger.co.za` + Vercel + Chibase; almost no third-party citations yet | **Ops / human:** directories, LinkedIn, industry associations, Reddit/civic-tech threads — cannot be faked in this repo |
| **3. Knowledge & FAQ hub** | WP home has thin `<details>` FAQ; Vercel `#faq` was outdated (sample preview language) | **Shipped:** `/faq` with NL questions + capability table + FAQPage schema. **WP:** paste mirror questions (below) |
| **4. Feed indexes + PR** | Need Search Console / Bing Webmaster on **both** WP and Vercel hosts | **Ops:** submit sitemaps; LinkedIn/case studies; do not blast from Resend OTP keys |

### Surface split (do not blur)

| Host | SEO / AEO job |
|------|----------------|
| `trustledger.co.za` (WordPress) | Brand homepage, pricing story, Privacy/Terms, primary **entity URL** in Organization schema `url` |
| Vercel frontend | Product facts (`/product`, `/faq`), assessment, trial/pay — structured data + `llms.txt` |
| Taskade showcase | Optional product tour — prefer **noindex** so it does not compete with WP/Vercel |
| `app.trustledger.co.za` | App login — not a marketing index target |

---

## 2. What we implemented in this repo

| Item | Location |
|------|----------|
| Canonical definition + FAQ corpus | `src/lib/aeo/siteFacts.ts` |
| Schema builders | `src/lib/aeo/jsonLd.ts` |
| JSON-LD component | `src/components/seo/JsonLd.tsx` |
| FAQ hub | `/faq` → `src/app/faq/page.tsx` |
| AI crawler brief | `public/llms.txt` |
| robots allowlist (AI-friendly, private paths blocked) | `src/app/robots.ts` |
| sitemap includes `/faq`, `/pay` | `src/app/sitemap.ts` |
| Home + product front-loaded definition + schema | `src/app/page.tsx`, `src/app/product/page.tsx` |
| Stale “Demo” OG copy removed | `src/app/layout.tsx` |

Validate after deploy:

- Google [Rich Results Test](https://search.google.com/test/rich-results) on `/`, `/product`, `/faq`
- [Schema Markup Validator](https://validator.schema.org/)
- Fetch `https://<site>/llms.txt` and `/robots.txt`

---

## 3. WordPress (`trustledger.co.za`) checklist

Marketing still owns the brand homepage. Align WP with Vercel facts:

1. **Declarative opening** (above the fold or first paragraph): paste the definition from `PRODUCT_DEFINITION` in `siteFacts.ts` (no ™ required; product name is TrustLedger only).
2. **FAQ block:** mirror the questions in `PUBLIC_FAQS` (or iframe/link prominently to `https://trustledger-frontend-pi.vercel.app/faq`). Remove any “preview needs no signup / sample desk” language — sample demo is retired (ADR-033).
3. **Schema:** add Organization + FAQPage via Yoast/Rank Math/custom HTML to match Vercel (same definition, `sameAs` → Chibase + Vercel product URL).
4. **robots.txt / sitemap:** confirm SpeedyCache or security plugins are **not** blocking `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `Bingbot`. Prefer allow-all for public marketing paths.
5. **Search Console:** property for `trustledger.co.za` + submit WP sitemap; separately add Vercel host property and submit `https://trustledger-frontend-pi.vercel.app/sitemap.xml`.
6. **Bing Webmaster Tools:** same two hosts (ChatGPT Search leans on Bing’s index).
7. After paste: purge SpeedyCache (`docs/wordpress/PASTE_PLANS.md`).

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
| After each marketing deploy | Rich Results Test on `/faq`; `llms.txt` reachable |
| Monthly | Search Console coverage (WP + Vercel); Bing URL inspection |
| Monthly | Otterly / manual prompts: “SRM software South Africa”, “community grievance tracking tool”, “Stakeholder Relationship Management infrastructure” |
| Quarterly | Refresh `PUBLIC_FAQS` if packaging or versions change; update WP mirror |

---

## 7. Honest expectations

- AEO is **citation + entity** work. Schema and `/faq` make TrustLedger *parseable*; directories and third-party mentions make it *believable* to models.
- Visibility lag of weeks–months after publishing is normal.
- Taskade Feature Showcase helps demos; it is **not** a substitute for indexed FAQ/schema on WP/Vercel.

When product facts change, edit `src/lib/aeo/siteFacts.ts` first, then WP paste and LinkedIn one-liners.
