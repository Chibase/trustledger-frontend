# TrustLedger Frontend

Next.js app for **TrustLedger** — stakeholder relations dashboards with an interactive **Demo** on Vercel.

## Docs (read these first)

| File | Purpose |
|------|---------|
| `docs/BUILD_PLAN.md` | Packets, scope, autonomy rules |
| `docs/DECISIONS.md` | Locked architecture choices |
| `docs/DESIGN_SYSTEM.md` | Colours, type, UI rules |
| `AGENTS.md` | Agent operating rules |

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo).

```bash
# optional .env.local
NEXT_PUBLIC_DEV_ROLE=community
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_AI_MOCK=true
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Product home → Try the demo |
| `/demo` | Public demo entry (pick role) |
| `/app/dashboard` | Role workspace |
| `/app/projects` | Projects |
| `/app/incidents` | Incidents + AI assist |
| `/app/issues/report` | Assisted intake |
| `/app/reports` | Client/admin briefs |

## Deploy

Push `master` to GitHub; Vercel auto-builds. See `docs/VERCEL_SMOKE.md`.

Demo does **not** require Frappe.

## Marketing handoff

Paste Demo CTAs into WordPress using `docs/WORDPRESS_CTA.md`.

## Backend handoff

Interserv implementers: follow `docs/FRAPPE_API_CONTRACT.md`.
