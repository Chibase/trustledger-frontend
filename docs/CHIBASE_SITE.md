# Chibase Consulting public site (Next.js, same project as TrustLedger)

**Status:** Preview on the TrustLedger host at `/firm`. DNS cutover waits until Webway malware cleanup is confirmed.  
**Email:** MX for `chibaseconsulting.co.za` and `trustledger.co.za` **stays on Webway**. This packet only serves HTTPS pages.

## Why it exists

The WordPress brochure was long, low-converting, and then **compromised** (casino injection + fake Terminal “Human Verification”). The firm site is rebuilt here as short pages, same visual language as TrustLedger, **separate public identity** (ADR-039 / ADR-046).

| Surface | Job |
|---------|-----|
| Chibase Consulting | Mother body — facilitation, MEL, IKS, advisory |
| TrustLedger | SRM product — grievance desk + Stakeholder Intelligence |

They **complement**; they do not merge brands.

## Preview (before DNS)

- Product host: `https://<trustledger-host>/firm`
- `/firm` is **noindex** on the product host so it does not compete with the future canonical domain.
- TrustLedger footer “Chibase Consulting” points at `/firm` until the old WordPress origin is safe.

## After the SP confirms WordPress is clean

1. In the hosting dashboard for this app, add domains `chibaseconsulting.co.za` and `www.chibaseconsulting.co.za`.
2. Point **A / CNAME (www)** at the app. **Do not move MX / mail.**
3. Set `NEXT_PUBLIC_CHIBASE_SITE_URL=https://chibaseconsulting.co.za` **only after** this app is the public hostname (never while WordPress still answers that name).
4. Optional: `CHIBASE_HOSTS=chibaseconsulting.co.za,www.chibaseconsulting.co.za`.
5. Request proxy will serve `/` as the firm home on that host and send `/trial`, `/product`, `/app` visitors to the TrustLedger product URL with `utm_source=chibase`.
6. Old WP slugs 308 to the short pages (`/about-us-critical-involvement` → `/about`, etc.).
7. Add `chibaseconsulting.co.za` to the reCAPTCHA domain list.

## Pages

| Path on firm host | Preview path | Purpose |
|-------------------|--------------|---------|
| `/` | `/firm` | Promise, three services, two CTAs |
| `/practice` | `/firm/practice` | Facilitation, MEL, IKS, field intervention |
| `/trustledger` | `/firm/trustledger` | How the product sits under the firm |
| `/insights` | `/firm/insights` | Two short notes |
| `/about` | `/firm/about` | Mother body + paper citation |
| `/contact` | `/firm/contact` | Name, work email, note — **no CAPEX form** |

Contact posts to `/api/contact` with `source=chibase` → CRM Lead source **Chibase Consulting**.

## What we will not do

- Co-brand TrustLedger hero as “Chibase TrustLedger”
- Host product checkout on the firm domain
- Claim a software Rapid-Response Division (field intervention is a **people** service)
- Move email hosting off Webway in this packet
