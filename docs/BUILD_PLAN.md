# TrustLedger Frontend — Build Plan

> **Single source of truth** for scope, locked decisions, packet order, and agent behaviour.
> Goal: **full functional Demo on Vercel** with minimal human interruption.
> Frappe live wiring, Cloudflare, and WordPress funnel polish come **after** Demo is shippable.

## 1. Product

| Item | Value |
|------|--------|
| Official name | **TrustLedger** |
| App host | **Vercel** |
| Demo URL target | `/demo` (and role dashboards under `/app/...`) |
| Backend (later) | Frappe `srm-core` on Interserv |
| Marketing (later) | WordPress `trustledger.co.za` on Webway |
| Runtime AI (later) | Grok via `srm-core` only — never from browser |

**Current phase:** Demo-complete SaaS frontend (mock data + mock AI). No Frappe required to use or deploy.

## 2. Locked decisions (do not re-ask)

See `docs/DECISIONS.md`. Agents **must not** reopen these unless the user explicitly overrides.

Summary:

1. TrustLedger branding only (no AccordBridge in UI).
2. Four roles: `community` | `contractor` | `client` | `admin`.
3. Demo mode is first-class; live mode is a flag for later.
4. Mock services mirror future Frappe shapes.
5. AI = suggest → human apply → save (even in demo).
6. Design system in `docs/DESIGN_SYSTEM.md` is mandatory.
7. Packet-driven delivery; one active packet at a time.
8. Vercel deploy must stay green (`npm run build`).

## 3. Agent autonomy rules (minimise human interference)

When implementing:

1. **Follow this file** and the active packet only.
2. **Do not ask** for preference on colours, fonts, IA, or stack — already locked.
3. **Do not** add Frappe auth, Cloudflare, or WordPress changes in this phase.
4. **Do** update `docs/CHANGELOG_INTERNAL.md` when a packet completes.
5. **Do** run `npm run lint` and `npm run build` before considering a packet done.
6. **Only stop and ask** if: secrets/credentials needed, destructive prod action, or BUILD_PLAN contradiction.
7. Prefer extending mock data/services over inventing parallel patterns.
8. Keep commits focused: one packet ≈ one commit when user asks to commit.

## 4. Information architecture

```
/                     Marketing-lite app home → CTA to /demo
/demo                 Demo landing: role picker + “Demo data” notice + lead CTA
/login                Dev/demo role session (cookie) — same as today, restyled
/app                  Authenticated shell (sidebar + topbar)
/app/dashboard        Role home (real widgets, not bullet lists)
/app/projects         Project list + detail
/app/incidents        Incident list
/app/incidents/[id]   Case desk + AI assist
/app/issues/report    Assisted intake
/app/reports          Client/admin briefs
/app/settings         Profile/role display (demo)
```

Legacy routes (`/dashboard`, `/incidents`, …) **redirect** into `/app/...` so old links work.

## 5. Demo behaviour

| Behaviour | Rule |
|-----------|------|
| Entry | `/demo` explains demo, picks role, sets `session-role` + `tl-mode=demo` cookie |
| Banner | Persistent “Demo mode — sample data” on all `/app` pages |
| Data | `src/data/mock/*` only |
| AI | `NEXT_PUBLIC_AI_MOCK=true` (default) |
| Lead capture | Soft gate modal after N meaningful actions (default 3) OR “Book a demo” in shell |
| Persistence | localStorage for demo actions optional; no server writes |
| Live mode | Out of scope this phase (`tl-mode=live` stub only) |

Meaningful actions: submit issue, apply AI suggestion, generate brief, open incident assist.

## 6. Role dashboards (must ship)

| Role | Widgets / views |
|------|-----------------|
| **community** | Ward projects status, my reported issues, report CTA, meeting notes list |
| **contractor** | Assigned projects, open site incidents, upload evidence stub, deadlines |
| **client** | Portfolio KPIs, budget vs spend, open risk/incidents, compliance brief AI |
| **admin** | Intake queue, SLA breach list, escalations, users/roles stub, audit snippet |

## 7. Packet roadmap

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| 00 | Docs & agent rails | BUILD_PLAN, DECISIONS, DESIGN_SYSTEM, AGENTS, CHANGELOG | **Done** |
| 01 | Design system + shell | Tokens, fonts, AppShell, Demo banner, nav | **Done** |
| 02 | Demo entry + session | `/demo`, mode cookie, redirects, lead CTA stub | **Done** |
| 03 | Mock domain layer | Expand projects/incidents/notes; service APIs | **Done** |
| 04 | Community dashboard + intake | Full community home; polish report issue | **Done** |
| 05 | Contractor dashboard | Site ops home + evidence stub | **Done** |
| 06 | Client dashboard + reports | KPIs + brief page | **Done** |
| 07 | Admin dashboard | Queue, SLA, escalations | **Done** |
| 08 | Incident desk polish | List filters, detail timeline UI, AI panels | **Done** |
| 09 | Demo funnel + empty/loading | Soft gate, toasts, responsive QA | **Done** |
| 10 | Vercel harden | README deploy, env example, smoke checklist | **Done** |

**Out of scope until post-Demo:** Frappe auth, real API, Cloudflare, WordPress CTAs, Grok API keys.

## 8. Quality gates (every packet)

```bash
npm run lint
npm run build
```

Manual smoke (packet 09+): `/demo` → each role → one AI action → lead CTA visible.

## 9. Repository layout (target)

```
docs/
  BUILD_PLAN.md          ← this file
  DECISIONS.md
  DESIGN_SYSTEM.md
  CHANGELOG_INTERNAL.md
src/
  app/
    demo/
    app/                 ← authenticated product routes
    (marketing home)
  components/
    shell/
    ai/
    dashboard/
    ui/
  data/mock/
  services/
  types/
  config/
```

## 10. Revision history

| Date | Change |
|------|--------|
| 2026-07-11 | Initial Demo-first BUILD_PLAN (Packet 00) |
