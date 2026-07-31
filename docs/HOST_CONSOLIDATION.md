# Public host consolidation (ADR-042)

**Goal:** one indexed public face for TrustLedger so search engines and AI answer engines stop splitting signals across WordPress and the Next.js app.

| Role | Host | Status |
|------|------|--------|
| Public marketing + product | **`https://trustledger.co.za`** → Next.js on Vercel | **Canonical target** |
| TrustLedger Cloud (app) | `https://app.trustledger.co.za` | Keep (not marketing) |
| WordPress / Webway | Email / mailbox only after cutover | **No public brochure** |
| `*.vercel.app` | Deploy URL | Fallback until apex DNS flips |

**Retire WordPress marketing. Keep the Next.js site.** WP may remain for email hosting only.

**Live check (2026-07-31):** apex still answered as WordPress/Apache while `trustledger-frontend-pi.vercel.app` served Next.js. Domain “connected” in Vercel ≠ DNS cutover. See `docs/HUMAN_ONLY_AEO.md` §1.

---

## Why (BrandRadar, 31 Jul 2026)

- TrustLedger named in **0/15** buyer prompts; mention rate **0%**.
- Name collisions (UK fintech, US accounting, defunct crypto) outranked the SA SRM product.
- Parent Chibase appeared in **3/15**; **`trustledger.co.za` never surfaced** as a citation source.
- Competitors with one strong web entity + directories + trade press won category prompts.

---

## Repo vs human

| In-repo (agents) | Human only |
|------------------|------------|
| FAQ, `/compare`, ESS10 guide, schema, `llms.txt`, privacy/terms | DNS apex → Vercel |
| Sitemap / robots allow new routes | `NEXT_PUBLIC_SITE_URL` on Vercel Production |
| Brochure keyword sections on home | Search Console + Bing submit |
| | Directories, LinkedIn, Crunchbase, trade press |

Checklist for humans: **`docs/HUMAN_ONLY_AEO.md`**.

---

## After DNS flip — smoke

1. `curl -sI https://trustledger.co.za` → `server: Vercel`
2. `/compare`, `/guides/ess10-ifc-grievance`, `/privacy`, `/terms` return 200
3. Rich Results Test on `/` and `/faq`
4. Fetch `/llms.txt` and `/sitemap.xml`

Detail playbook: `docs/AEO_VISIBILITY.md`.
