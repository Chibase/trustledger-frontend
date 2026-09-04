# TrustLedger product versions

> **Internal** labels for engineering and ops. Public UI, FAQ, Themba, and marketing must **not** name Version 001/002 or TEDS (ADR-044). For plan packaging and public agent scripts see **`docs/PLATFORM_STRATEGIC_BRIEF.md`** §6.

## Version 001 (current — live resolution desk)

**Internal name:** TrustLedger Version 001 (not shown in client UI)  
**What it is:** Grievance / resolution desk + role workspaces + trial/pay + Cloud-backed ops for paying Owners.

| Included | Notes |
|----------|--------|
| Role dashboards (community / contractor / client / admin) | Trial own-data or live Cloud |
| Projects (light) + Incidents / grievance intake | Core pain wedge — GO LIVE Done |
| AI assist (suggest → human apply) | Mock default; Cloud path when configured |
| 14-day own-data trial + Paystack subscribe | Sample `/demo` **retired** → `/product` |
| Live login + email verification | Buyers after provision (`PLATFORM_OPERATOR_ONLY=0`) |
| Marketing home, assessment, Ops plane | Not the full ESIP MVP |

**Internal line (ops only — do not paste into marketing):**  
*Version 001 is live — the trust & grievance resolution desk. Stakeholder Intelligence (registry, engagements, commitments) is available on entitled Version 002 surfaces and continues to deepen on Cloud.*

## Version 002 (active — Stakeholder Intelligence core)

**Goal:** Close the gap vs market tools on the SRM engine buyers actually need.

| Domain | Outcome | Posture (2026-07-23) |
|--------|---------|----------------------|
| **Geo** | SA hierarchy + place links; socio-econ layers | ZA pack seeded; Stats SA deferred |
| **Stakeholders** | Registry (people, orgs, influence, interests) | UI + **Cloud DocType/BFF** |
| **Engagements** | Meetings, consultations, minutes/actions | UI + **Cloud DocType/BFF** |
| **Commitments** | Promise → owner → deadline → evidence → closed | UI + **Cloud DocType/BFF** |
| **Stronger grievance** | Fuller lifecycle on Frappe | UI + **Cloud stage stamps** on `TL Incident` |
| **Reports** | Operational + executive packs | Dual hub shipped; live SI bind next |
| **Intelligence / ESG** | Indicators, trust/ESG depth, stronger AI | Demo indicators; live Grok deferred |

**Internal line (ops only — do not paste into marketing):**  
*Version 002 — Stakeholder Intelligence core on Cloud for entitled plans. Still deepening versus the full Engineering Documentation Series blueprint — Version 001 remains the resolution desk.*

## Version 003+ (later)

Public portal, offline/mobile, GIS editing, marketplace — TEDS “future scope”. Do not market as imminent.

- Native / App Store apps, offline-first field sync  
- Public community portal, WhatsApp/SMS as product intake  
- GIS editing  
- Marketplace / multi-tenant ISV channel  
- Standalone licensed products (Grievance Logger, Supplier Portal, Field Companion) — ADR-054; use focused SKUs on one workspace (`docs/MODULAR_SKUS.md`)

## Rules

1. Never market Version 002/003 capabilities as “fully available” until the domain is end-to-end (UI + durable data path). Label illustrative data honestly.
2. Soft commercial honesty: Practitioner ≠ full SI; Project/Institutional carry the SRM engine (`docs/PLATFORM_STRATEGIC_BRIEF.md` §5).
3. Version numbers stay **internal**. Do not badge Version 001/002 in the app shell, marketing footer, FAQ, or Themba (ADR-044).
4. Sample guest demo is discontinued (ADR-033).
