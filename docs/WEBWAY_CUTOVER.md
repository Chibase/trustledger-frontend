# Webway cutover checklist (HubSpot out + marketing on Vercel)

**Locked:** ADR-034 — Frappe-only acquisition CRM.  
**Public host:** Vercel at `https://trustledger.co.za` (marketing + product UI + forms).  
**CRM host:** Frappe Cloud (`https://app.trustledger.co.za`).  
**Webway role (2026-08-10):** mailboxes / DNS mail only — **WordPress brochure retired.**

Legacy paste packs under `docs/wordpress/` are historical. Do not re-publish WP as the brand homepage.

Full HubSpot phases: `docs/HS_CUTOVER.md`.

---

## Done when marketing left Webway

- [x] Apex `trustledger.co.za` serves the Vercel Next.js app (same product as former `*.vercel.app`).
- [x] In-repo: `NEXT_PUBLIC_SITE_URL` fallback → `https://trustledger.co.za`; `vercel.json` 308 from legacy Vercel hostname → apex (**excludes `/api/*`** so Paystack webhooks on the old host still POST).
- [x] `/privacy` and `/terms` live on Vercel (replace old WP legal URLs).
- [x] Email / LinkedIn CTA packs use `https://trustledger.co.za/...`.

---

## Still verify in Production

- [ ] Vercel Production env: `NEXT_PUBLIC_SITE_URL=https://trustledger.co.za` (and rebuild if it was still `*.vercel.app`).
- [ ] `LEAD_BACKEND=frappe` (or unset with Frappe keys — HS-1 default).
- [ ] `GET /api/health` → `launch.leadBackendCutover: true`.
- [ ] Smoke once each → Desk **CRM Lead**: `/contact`, `/quote`, `/assessment`.
- [ ] Frappe CORS allowlist includes `https://trustledger.co.za` (and optionally legacy `*.vercel.app` until redirects settle).
- [ ] Search Console + Bing: property for `trustledger.co.za`; submit `/sitemap.xml`.
- [ ] Confirm Webway WordPress is offline or noindexed so it cannot compete with the apex.

---

## Mailboxes (Webway may remain)

Outgoing brand mail still uses domain mailboxes (e.g. `sales@trustledger.co.za`, `info@trustledger.co.za`) configured in Frappe Desk — see `docs/FRAPPE_EMAIL_MARKETING.md`. That is **not** a marketing website host.

---

## Do not

- Re-add HubSpot form embeds or treat HubSpot as required CRM.
- Cite `trustledger-frontend-pi.vercel.app` in public emails, FAQ, or schema.
- Put Frappe/Vercel/HubSpot stack brands in marketing prose (ADR-039).
