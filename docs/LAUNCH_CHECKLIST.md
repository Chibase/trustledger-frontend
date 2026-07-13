# Launch checklist — TrustLedger

## Fixed in code (this pass)

- Demo soft-gate leads → HubSpot (`POST /api/demo/lead`)
- Assessment lead fails closed in production if HubSpot unset
- Contact email unified to `info@trustledger.co.za`
- Privacy Policy links on assessment + demo lead forms
- Login copy no longer says “Dev”
- `NEXT_PUBLIC_DEV_ROLE` ignored in Vercel production
- Dynamic `robots.ts` + `/reports` redirect
- Placeholder phone removed from Assessment WP paste kit

## Human actions before public launch

1. **Hard-refresh / re-paste WP Assessment** if footer still shows `+00 000 000 0000` — use updated `docs/wordpress/page-assessment.txt`.
2. **Confirm HubSpot** receives demo-gate + assessment leads (check Contacts after a test).
3. **Decide final product domain** (keep `*.vercel.app` or attach custom domain) and set `NEXT_PUBLIC_SITE_URL` to match; update Interserv CORS if domain changes.
4. **Frappe Cloud / `app.trustledger.co.za`** — domain Active; set Vercel `NEXT_PUBLIC_API_BASE_URL` + `FRAPPE_BASE_URL`; CORS + API keys per `docs/FRAPPE_CLOUD_SETUP.md`.
5. **Legal** — confirm Privacy + Terms on `trustledger.co.za` have real entity name/address (placeholders remain).
6. **Phone / Calendly** — add when ready (removed fake phone from paste kit).
7. **Demo banner** — keep for sample-data honesty, or hide only for live users (already the case).
8. **Revoke any Vercel tokens** shared in chat.
9. **Support Phase A** — smoke `/status`, Repair session, and one Support ticket from `/app` (HubSpot message starts with `[Source: support_ticket]`).
10. **Platform Operator lockdown** — on Vercel set `PLATFORM_OPERATOR_ONLY=1` and `PLATFORM_OPERATOR_EMAILS` to your live login email (e.g. `admin@chibaseconsulting.co.za`). Confirm only you can `/login/live`. See `docs/PLATFORM_OPERATOR.md`.

## Recommended launch mode

**Marketing + interactive demo + assessment** (current default `NEXT_PUBLIC_DATA_MODE=demo`) is safest for public launch. Turn on live Frappe only for named pilots after Interserv smoke passes.
