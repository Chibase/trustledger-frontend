# TrustLedger Frontend — Vercel smoke checklist

## Deploy

1. GitHub `master` connected to Vercel project
2. Framework preset: Next.js
3. Env (optional for Demo):
   - `NEXT_PUBLIC_AI_MOCK=true`
   - `NEXT_PUBLIC_API_BASE_URL` (unused while mock)
4. Production URL should serve `/` and `/demo`

## Smoke after deploy

- [ ] `/` shows TrustLedger home + Try the demo
- [ ] `/demo` role picker works for each role
- [ ] Demo banner visible on `/app/*`
- [ ] Community: ward projects, notes, report issue + AI apply
- [ ] Contractor: assigned projects + site incidents
- [ ] Client: KPIs + generate brief
- [ ] Admin: intake queue + escalations
- [ ] Incidents filters (status / SLA / search)
- [ ] Incident detail: timeline, evidence, draft reply
- [ ] After ~3 AI/submit actions, lead gate appears
- [ ] Sign out returns toward `/demo`

## Not required for Demo phase

- Frappe / Interserv connectivity
- Cloudflare DNS
- WordPress CTA wiring
