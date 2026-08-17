# Chibase Consulting public site (same app as TrustLedger)

**Status:** Ready to **retire WordPress** and point HTTPS at this app.  
**Email:** MX for `chibaseconsulting.co.za` and `trustledger.co.za` **stays on Webway**. This app only serves HTTPS pages.  
**Do not migrate** WordPress posts, media, themes, or plugins — the old site is malware-contaminated.

## Why we retire WordPress (not “clean” it)

Webway (Brayden, 2026-08-14) confirmed malware removal, database cleanup, and forensic investigation are **out of standard hosting support**. Paying a WP specialist to disinfect a compromised brochure is the wrong spend: the replacement site already exists here, and a “cleaned” WordPress install is still WordPress (same attack surface).

**Locked (ADR-046):** Delete/suspend the Chibase WordPress document root and database. Point **website DNS only** at this app. Leave **mail DNS** on Webway. Import nothing from WP.

`trustledger.co.za` WordPress (product marketing) is **unchanged** unless a later packet says otherwise.

| Surface | Job |
|---------|-----|
| Chibase Consulting | Mother body — facilitation, MEL, IKS, advisory |
| TrustLedger | SRM product — grievance desk + Stakeholder Intelligence |

They **complement**; they do not merge brands.

## Preview (until DNS)

- Product host: `https://<trustledger-host>/firm` (noindex)
- TrustLedger footer “Chibase Consulting” → `/firm`

## Cutover order (operators)

Do this **after PR #117 is on Production**. Do **not** change nameservers (that would move mail).

### 1. This app (you)

1. Production already includes `/firm` + host routing (`src/proxy.ts`).
2. Project → Domains: add `chibaseconsulting.co.za` **and** `www.chibaseconsulting.co.za`. Copy the **exact** A / CNAME values from the domain cards (do not guess).
3. reCAPTCHA admin: add both hostnames.
4. Do **not** set `NEXT_PUBLIC_CHIBASE_SITE_URL` until step 3 is green (otherwise search engines are told the old origin is canonical while it may still be WordPress).

### 2. Webway (Brayden) — in their scope

This is hosting-environment work, not “WordPress security cleanup.” Ask them to:

1. **Leave untouched:** nameservers, **MX**, SPF/DKIM/DMARC TXT, `autodiscover` / `mail` / `webmail` / `cpanel` hostnames, and any other record that is not the public website.
2. **Website DNS only:** replace the apex **A** (and any old website AAAA) with the value from the domain card; set **www CNAME** to the value from the domain card. Remove leftover website A/CNAME records that still point at the WordPress box.
3. **Retire WordPress:** delete or suspend the Chibase WP site (files, `wp-content`, plugins, themes) and drop/export-then-destroy the WP database. Do **not** copy that content to the new site. Do **not** “repair” plugins.
4. Confirm mail still flows (`info@chibaseconsulting.co.za`).

Paste for Brayden: [Reply to Webway](#reply-to-webway).

### 3. After HTTPS serves this app

1. Open `https://chibaseconsulting.co.za/` — Chibase home, not WordPress, not casino/ClickFix.
2. `https://chibaseconsulting.co.za/wp-admin` → **404**.
3. `https://chibaseconsulting.co.za/trial` → TrustLedger product URL with `utm_source=chibase`.
4. Send a test to `info@chibaseconsulting.co.za`.
5. Then set Production env `NEXT_PUBLIC_CHIBASE_SITE_URL=https://chibaseconsulting.co.za` (and optional `CHIBASE_HOSTS`) and redeploy.
6. Rotate the **Webway control-panel** password if it was reused with WordPress admin. WP admin is gone; panel access is not.

Typical website records (confirm on the domain card before asking Webway):

| Host | Type | Typical target | Touch? |
|------|------|----------------|--------|
| `@` / apex | A | `76.76.21.21` (or card value) | **Replace** (website) |
| `www` | CNAME | `cname.vercel-dns.com` or `cname.vercel-dns-0.com` (card value) | **Replace** (website) |
| MX / mail TXT / `mail` | MX, TXT, CNAME, A | existing Webway mail | **Do not touch** |

This app serves **both** `chibaseconsulting.co.za` and `www` as the firm site. Do **not** also 308 `www` ↔ apex in the app — that fights the project domain redirect and loops. Pick one primary on the **Domains** page (recommended: apex primary, www redirects to apex; or keep Vercel’s default apex → www). Add **both** hostnames or `www` 404s.

## Pages

| Path on firm host | Preview path | Purpose |
|-------------------|--------------|---------|
| `/` | `/firm` | Promise, three services, two CTAs |
| `/practice` | `/firm/practice` | Facilitation, MEL, IKS, field intervention |
| `/packages` | `/firm/packages` | Consulting catalogue with listed starter fees |
| `/trustledger` | `/firm/trustledger` | How the product sits under the firm |
| `/insights` | `/firm/insights` | Two short notes |
| `/about` | `/firm/about` | Mother body + paper citation |
| `/contact` | `/firm/contact` | Name, work email, note — **no CAPEX form** |

Contact posts to `/api/contact` with `source=chibase` (optional `package`) → CRM Lead source **Chibase Consulting**.

Consulting checkout (when `CHIBASE_AMOUNT_*_CENTS` > 0) posts to `/api/chibase/pay/initialize` on the firm host. TrustLedger `/pay` still 302s off this origin. A consulting payment never provisions a TrustLedger workspace (ADR-048).

Home hero includes a **preview desk** (ADR-047): visitors add mock cases/people/promises in this browser only. It is not a TrustLedger workspace.

Known old WP slugs 308: `/about-us-critical-involvement` → `/about`, `/social-licence-to-build-framework` → `/practice`, `/home-social-licence-to-build` → `/`, `/contact-us` → `/contact`. Injected spam URLs are not migrated; they return **410 Gone** (see `src/lib/security/wpSpamPaths.ts`) so crawlers drop them faster than soft 404s.

## SEO recovery after WordPress malware (ops)

The live Vercel firm site is clean. Search engines may still show **cached titles** for retired casino/affiliate URLs. Mitigate as follows:

### Already in this app

1. Firm host returns **410 Gone** + `noindex` for known spam slugs and casino/adult/togel path heuristics.
2. Firm host serves `/sitemap.xml` with only clean brochure paths (`/`, `/practice`, `/packages`, …).
3. Firm `/robots.txt` allows those paths, points at the firm sitemap, and disallows spam-shaped URL patterns.
4. Probe block still covers `/wp-admin`, `*.php`, xmlrpc (403/404 via Vercel + app).

### Operator (outside this repo)

1. Confirm `NEXT_PUBLIC_CHIBASE_SITE_URL=https://chibaseconsulting.co.za` (or your primary firm URL) is set in Production and redeployed.
2. **Google Search Console** (property for `chibaseconsulting.co.za` + www):
   - Removals → Temporary removals / Clear cached URL for spam URLs still in results.
   - URL inspection → Request indexing for `/`, `/practice`, `/packages`, `/contact`, `/about`, `/insights`, `/trustledger`.
   - Sitemaps → submit `https://www.chibaseconsulting.co.za/sitemap.xml` (or apex, matching your primary domain).
3. Ask Webway once more that the **WordPress document root + DB are deleted** (DNS-only cutover is not enough if an old host remains).
4. Tell marketing partners: do not cite indexed spam URLs; use the clean brochure paths only.

### Reply to marketing / ClickUp

```
The live Chibase Consulting website is already on our application host (not WordPress).
Homepage and brochure paths are clean. The casino / gambling / adult URLs you found
are retired WordPress SEO-spam that search engines still list from the old compromise.

Those URLs now return HTTP 410 Gone. Please use only:
https://www.chibaseconsulting.co.za/
https://www.chibaseconsulting.co.za/practice
https://www.chibaseconsulting.co.za/packages
https://www.chibaseconsulting.co.za/contact

We are clearing Search Console cache/index for the spam URLs. Do not delay outreach
on the assumption the live site still serves casino content — it does not.
```

## What we will not do

- Import WordPress content, media, themes, or plugins
- Co-brand TrustLedger hero as “Chibase TrustLedger”
- Host **TrustLedger** product checkout (`/pay`) on the firm domain
- Fold consulting SKUs into Solo / Practitioner / Project / Institutional
- Claim a software Rapid-Response Division (field intervention is a **people** service)
- Move email hosting off Webway
- Retire `trustledger.co.za` WordPress in this packet

## Reply to Webway

```
Hi Brayden,

Thank you — we will not ask Webway to clean or forensically remediate WordPress.

We are retiring the Chibase Consulting WordPress site. The replacement brochure is already live on our application host. We will not migrate WordPress content, themes, or plugins.

Please treat this as a hosting-environment request:

1. Do not change nameservers.
2. Do not change MX, SPF, DKIM, DMARC, or any mail / webmail / autodiscover records. Email for chibaseconsulting.co.za must stay on Webway.
3. Point only the public website at the new host:
   - Apex A record → [paste value from the project domain card]
   - www CNAME → [paste value from the project domain card]
   Remove any other A/AAAA/CNAME that still send the website to the WordPress server.
4. Delete or suspend the WordPress installation for chibaseconsulting.co.za (files, plugins, themes) and destroy the WordPress database. Do not copy that content anywhere.

trustledger.co.za WordPress and all email hosting stay as they are.

I will send the exact A and CNAME values as soon as the domain is added on our application host.

Kind regards,
Thozamile
```
