# TEDS maturity report — blueprint vs product

**Source blueprint:** TrustLedger Engineering Documentation Series (TEDS) Volume 1 — Platform Foundation  
**Product labels:** Version **001** (live desk) → Version **002** (Stakeholder Intelligence core)  
**Living code source:** `src/lib/tedsMaturity.ts` (also rendered on dashboards)  
**Policy:** ADR-023 — soft launch may wait until V002 core is credible  

---

## Executive headline

**TEDS MVP ≈ 36% realised** in the current product (weighted average of nine core domains; commercial shell scored separately).

We are **closer** than before Version 002 kickoff: national **ZA geography** and an in-platform **stakeholder CRM** are now seeded. We are **not yet** at TEDS MVP completeness — engagements, commitments, fuller grievance workflow, and ESG indicators are the largest gaps.

---

## Dashboard placement (different levels)

| Level | Where | What you see |
|-------|--------|----------------|
| **Board / investors** | `/ops/executive` | Full domain table + % progress |
| **Platform ops** | `/ops` | Compact pulse + priority next |
| **Plan Owner / admin** | `/app/dashboard` (admin) | Compact build status |
| **Client** | `/app/dashboard` (client) | Compact capability roadmap |
| **Reports** | `/app/reports` | Full maturity report + AI brief |

---

## Domain scorecard (TEDS Ch.9 MVP + intelligence)

| Domain | Status | Score | Available now | Still needed |
|--------|--------|------:|---------------|--------------|
| Geographic Intelligence | Seeded | 70% | ZA MDB 2020 pack (4 468 wards + 15 TCs); multi-country schema; `/app/geo` | Stats SA indicators; Frappe sync; more country packs |
| Stakeholder Registry (CRM) | Seeded | 45% | CRM list/detail; TEDS kinds; place-linked seed | Create/edit UI; relationships; Frappe DocType |
| Project Management | Partial | 40% | List/detail + budgets + role homes | Programmes/sites/teams; geo+CRM links |
| Engagement Management | Partial | 20% | Meeting notes stub | Meetings, attendance, minutes, actions |
| Issue & Grievance | Partial | 55% | Incidents, intake, AI suggest→apply | Full lifecycle + verify/close; Frappe workflow |
| Commitment Management | Not started | 0% | — | Register, owners, deadlines, evidence, KPIs |
| Reporting | Partial | 35% | Reports + AI brief + role KPIs + ops exec | Packs from live/geo/CRM; exports; heat maps |
| Administration | Partial | 30% | Settings; trial/demo/live; operator lockdown | Plan Owner invites; org RBAC; audit UI |
| Intelligence / ESG | Partial | 25% | AI assist; exec KPIs; empty indicator slots | Socio-econ ingest; trust/ESG scorecards |
| Commercial shell (extra) | Partial | 60% | Trial, Paystack, Version 001 messaging | Auto Owner post-pay when lockdown lifts |

---

## Are we getting closer?

**Yes — directionally.**

1. **Vision / problem / positioning** (TEDS Ch.1–5) — aligned in marketing and Version messaging.  
2. **Geo (Domain 1)** — jumped from stub → **national demo dataset**.  
3. **Stakeholders (Domain 2)** — jumped from thin mock → **CRM shell with TEDS kinds**.  
4. **Grievance desk (Domain 5) + AI pattern** — already the Version 001 wedge; still short of full TEDS lifecycle.  
5. **Commitments (Domain 6)** — still the clearest “TEDS says yes / product says no” gap.  
6. **Engagements (Domain 4)** — still notes-only, not a module.

So: closer on the **foundation layers** TEDS said to build first (geo + registry); still far on **governance loop** (engage → commit → resolve → report with ESG depth).

---

## Priority still to do (order)

1. **Engagements** — meetings / consultations / attendance / actions  
2. **Commitments** — register + dashboard KPIs  
3. **Stronger grievance** — full status machine on Frappe  
4. **Stats SA (or peer) indicators** — fill geo pack `indicators[]`  
5. **CRM create/edit + relationships**  
6. **Report packs** driven by geo + CRM + cases  
7. **Lift lockdown / Plan Owner** when V002 core is demoable  

---

## Public / board talking points

- *Version 001* = live resolution desk (honest).  
- *Version 002* = Stakeholder Intelligence core in build; **geo + CRM seeded**.  
- Do **not** claim full TEDS MVP, GIS editing, public portal, or auto-provisioned paid orgs yet.

---

## How to refresh this report

Edit scores/copy in `src/lib/tedsMaturity.ts` when a packet completes; dashboards and this doc stay in sync if you mirror major status changes here.
