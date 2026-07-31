# Webway cutover checklist (HubSpot out)

**Locked:** ADR-034 — Frappe-only acquisition CRM.  
**Superseded for hosts:** **ADR-042** — retire WordPress as parallel marketing; apex `trustledger.co.za` → Next.js. See `docs/HOST_CONSOLIDATION.md`.  
**Until DNS flip:** WordPress on Webway may still be the live apex; product/forms on the Next.js deploy.  
**CRM host:** Frappe Cloud (`https://app.trustledger.co.za`).

While WP remains live, it is **brochure + buttons only**. It must not host HubSpot forms, HubSpot tracking that owns leads, or relative `/contact` links. Prefer investing in host consolidation over new Elementor paste.

Full phases: `docs/HS_CUTOVER.md`. CTA URLs: `docs/WORDPRESS_CTA.md`. Paste packs: `docs/wordpress/PASTE_PLANS.md`.

---

## Before you touch Webway

- [ ] Vercel Production: `LEAD_BACKEND=frappe` (or unset with Frappe keys — HS-1 default).
- [ ] `GET /api/health` → `launch.leadBackendCutover: true`.
- [ ] Smoke once each on Vercel → Desk **CRM Lead**: `/contact`, `/quote`, `/assessment` (and feedback/support if easy).

---

## Webway (same sitting)

1. **Remove HubSpot**
   - [ ] Delete HubSpot form embeds / “Get a demo” iframes from Home, Contact, Assessment, Pricing, Footer.
   - [ ] Remove HubSpot tracking / chat widgets that post contacts to HubSpot (keep only if analytics-only and not required — prefer remove).
   - [ ] Do **not** add new HubSpot Free forms.

2. **Point every CTA at Vercel (absolute URLs)**

   | Label on WP | Destination |
   |-------------|-------------|
   | Start trial / 14-day trial | `…/trial?utm_source=wordpress&utm_medium=cta&utm_campaign=start_trial` |
   | Contact / Book walkthrough | `…/contact/?utm_source=wordpress&utm_medium=nav&utm_campaign=book_walkthrough` |
   | Talk to sales / Institutional | `…/contact?utm_source=wordpress&utm_medium=cta&utm_campaign=buy_institutional` |
   | Request quote | `…/quote?utm_source=wordpress&utm_medium=cta&utm_campaign=request_quote` |
   | Assessment | `…/assessment?utm_source=wordpress&utm_medium=cta&utm_campaign=srm_diagnostic` (or WP page that iframes Vercel) |
   | Subscribe Practitioner / Project | `…/pay?plan=practitioner` / `…/pay?plan=project` |
   | Product / how it works | `…/product` |

   Replace `…` with `https://trustledger-frontend-pi.vercel.app`.

3. **Paste packs (preferred)**
   - [ ] Home: paste `docs/wordpress/page-home.txt` (or update CTAs to match the table above).
   - [ ] Assessment: paste `docs/wordpress/page-assessment.txt` if the live quiz iframe is used.
   - [ ] Additional CSS: `docs/wordpress/additional-css.css` if layout breaks.

4. **Footer / nav Contact**
   - [ ] No relative `/contact` (404 on WP).
   - [ ] **Never label a `mailto:` link “Contact”** — on many PCs that opens Gmail/Google. Use absolute Vercel `/contact` for the Contact label; keep `mailto:info@trustledger.co.za` as the email address text only.
   - [ ] Prefer Vercel Contact over `mailto:` for “Contact” nav.

5. **Cache**
   - [ ] Purge SpeedyCache (or host cache).
   - [ ] Hard-refresh `https://trustledger.co.za/` and click each primary CTA once.

---

## After Webway

- [ ] Confirm each CTA lands on Vercel TrustLedger branding (not HubSpot).
- [ ] Confirm a test Contact/Quote still creates a **CRM Lead** on Frappe.
- [ ] Pause/disable HubSpot sequences that duplicated these forms.
- [ ] Later (HS-4): unset `HUBSPOT_*` on Vercel; cancel Free portal when archive export is done.

---

## Operating rule (one sentence)

**Strangers fill Vercel forms → Frappe Leads; money/commitment → Frappe Customer + live login. WordPress never owns data. HubSpot is out.**
