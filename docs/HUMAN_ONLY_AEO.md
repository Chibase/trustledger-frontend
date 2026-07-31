# HUMAN ONLY — how & where (BrandRadar / ADR-042)

Repo ships the brochure. You change DNS, Vercel env, and off-site listings.

**Live check (still true 31 Jul 2026 evening):**  
`trustledger.co.za` → `102.208.231.11` (**Apache / WordPress**).  
Product site → `https://trustledger-frontend-pi.vercel.app` (**Vercel**).

**Do not break email:** when you edit DNS, change only **web** A/CNAME/ALIAS for the site. Leave **MX** (and related SPF/DKIM TXT for mail) on Webway so `info@` / mailbox keep working.

---

## 1. Point the website at Vercel (blocking) — Webway DNS + Vercel

### A. Copy the records Vercel wants

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project **`trustledger-frontend`** (or whatever the TrustLedger Next.js project is named).
2. **Settings → Domains**.
3. If `trustledger.co.za` / `www.trustledger.co.za` are not listed, **Add** them and assign to **Production**.
4. Open each domain. Vercel shows exact records, usually:
   - **Apex** `trustledger.co.za`: **A** → `76.76.21.21` (or the value Vercel displays), **or** ALIAS/ANAME to `cname.vercel-dns.com` if Webway supports it.
   - **www**: **CNAME** → `cname.vercel-dns.com` (or the value Vercel displays).
5. Keep that tab open — match Webway to those values exactly.

### B. Edit DNS at Webway (where the domain is hosted today)

1. Log into **Webway** control panel (same place you manage TrustLedger WordPress / email).
2. Open **DNS** / **Zone editor** for **`trustledger.co.za`** (sometimes under Domains → Manage → DNS).
3. Find the records that send the **website** to the current Apache IP (`102.208.231.11`):
   - Apex **A** for `@` / `trustledger.co.za`
   - **www** A or CNAME
4. **Change** them to Vercel’s values from step A.  
   **Do not delete MX** records. **Do not** point mail to Vercel.
5. Save. Propagation can take minutes to a few hours.

### C. Confirm it worked

In a browser (incognito):

1. `https://trustledger.co.za` — should look like the Vercel TrustLedger home (not WP “Social Relations management Portal”).
2. Optional terminal: `curl -sI https://trustledger.co.za` → header **`server: Vercel`**.
3. Smoke: `/faq`, `/compare`, `/guides/ess10-ifc-grievance`, `/privacy`, `/terms`, `/llms.txt`.

### D. WordPress after the flip (email only)

- Public brochure is now Vercel. You do **not** need Elementor homepage updates anymore.
- Keep Webway/WP only for **mail** (webmail, MX, mailboxes). If WP still answers on some internal hostname, that is fine — just not as the public apex.

---

## 2. Set the canonical URL on Vercel — Vercel env

1. Vercel → same project → **Settings → Environment Variables**.
2. Add / edit for **Production**:
   - Name: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://trustledger.co.za`
3. **Deployments →** … on latest Production → **Redeploy** (required so metadata/sitemap pick up the new URL).

---

## 3. Tell Google & Bing — Search Console / Bing Webmaster

### Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console).
2. **Add property** → URL prefix → `https://trustledger.co.za`.
3. Verify (DNS TXT at Webway, or HTML tag, or if the site is already on Vercel you can use the meta/file method Vercel/GSC suggests).
4. **Sitemaps** → submit: `https://trustledger.co.za/sitemap.xml`.
5. Optional: Rich Results Test — [search.google.com/test/rich-results](https://search.google.com/test/rich-results) on `/` and `/faq`.

### Bing Webmaster Tools

1. [Bing Webmaster](https://www.bing.com/webmasters).
2. Add `https://trustledger.co.za` (can import from Google).
3. Submit the same sitemap URL.  
   (ChatGPT Search leans on Bing’s index.)

---

## 4. Software directories — vendor portals (one URL only)

Use **product name:** TrustLedger · **website:** `https://trustledger.co.za` · **category:** Stakeholder Relationship Management / grievance / community engagement · **HQ:** South Africa · **vendor:** Chibase Consulting (operator, not co-brand).

| Where | Start |
|-------|--------|
| Capterra | [capterra.com/vendors](https://www.capterra.com/) → list your software / claim listing |
| G2 | [g2.com](https://www.g2.com/) → get listed / vendor account |
| SourceForge | [sourceforge.net](https://sourceforge.net/) → add project / commercial listing |
| GetApp | [getapp.com](https://www.getapp.com/) → vendor listing |
| SoftwareSuggest | [softwaresuggest.com](https://www.softwaresuggest.com/) → submit product |

Do **not** put `*.vercel.app` as the public website on these.

---

## 5. Entity graph — LinkedIn, Crunchbase, Chibase site

### LinkedIn Company

1. [linkedin.com/company](https://www.linkedin.com/company/setup/new/) → create or edit **TrustLedger** Company Page (separate from personal profile).
2. Website: `https://trustledger.co.za`.
3. About: TrustLedger SRM / South Africa / grievance + stakeholder software; operator Chibase only as legal line.
4. Post weekly from `docs/exports/linkedin/WEEKLY_CONTENT.md` — link `/product`, `/faq`, `/compare` on the **apex**.

### Crunchbase

1. [crunchbase.com](https://www.crunchbase.com/) → add/claim organization **TrustLedger**.
2. Website = apex; location South Africa; short SRM description.

### Chibase website

1. Edit [chibaseconsulting.co.za](https://chibaseconsulting.co.za) (wherever that site is hosted — often Webway too).
2. Add a clear **Product: TrustLedger** link to `https://trustledger.co.za` (not the Vercel preview URL).

---

## 6. Trade press — email pitches

| Outlet | Where to start |
|--------|----------------|
| Engineering News | [engineeringnews.co.za](https://www.engineeringnews.co.za/) → Contact / Submit news / editorial contacts |
| Mining Weekly | [miningweekly.com](https://www.miningweekly.com/) → same pattern |

Pitch angle: SA-built SRM / grievance desk for mining, infrastructure, municipalities; link apex `/product` and `/guides/ess10-ifc-grievance`. No stack vendor names in the pitch.

---

## 7. Legal (optional)

Open `https://trustledger.co.za/privacy` and `/terms` **after** DNS flip (or preview on `*.vercel.app/privacy` now) and send to counsel if you want a formal POPIA review.

---

## Suggested order (same afternoon)

1. Vercel Domains → copy DNS values  
2. Webway DNS → flip A/CNAME (**keep MX**)  
3. Wait until apex shows Vercel  
4. `NEXT_PUBLIC_SITE_URL` + Redeploy  
5. Search Console + Bing sitemap  
6. LinkedIn Company + Chibase link (same day)  
7. Directories + press over the following week  

When step 3 is done, tell the agent — we can re-smoke the apex and fix any leftover 404s.
