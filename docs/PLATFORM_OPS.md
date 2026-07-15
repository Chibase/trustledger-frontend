# Platform Ops — command centre

**Locked with ADR-015 + ADR-016.**  
This is **not** a CRM and **not** the customer Plan Owner (`admin`) desk.

**Purpose:** Your control / command centre for the whole TrustLedger platform. Two surfaces share the same allowlist:

| Surface | Audience | URL |
|---------|----------|-----|
| **Executive Board** | C-suite / owner — board & investor briefs | `/ops/executive` |
| **Ops activity** | Day-to-day / junior ops | `/ops`, `/ops/activity` |

Frappe CRM / Customer / Paystack remain systems of record; Ops **reads and acts**, it does not replace CRM.

## Who can enter

| Role | Access |
|------|--------|
| **Platform Owner** (you) | Full `/ops` + `/ops/executive` |
| **Platform Staff** (emails you add later) | Scoped read / support (future) |
| Customer Plan Owner / demo users | **Never** |

Allowlist: `PLATFORM_OPERATOR_EMAILS` (same env as ADR-013).  
`/ops` is **always** allowlist-gated (even if customer lockdown is off).

**Entry (owner):** `https://trustledger-frontend-pi.vercel.app/ops/executive`  
**Login:** `/login/live` → homes to **`/ops/executive`**.

## Executive Board (`/ops/executive`)

Presentation-first overview for boards and investors:

- Headline KPIs (pipeline, demos, assessments, experience score)
- Activity trend + mix charts
- Conversion funnel
- Demographics: origin (UTM/source), industry/sector, influence level
- Sentiment / tool-usage perception + verbatim visitor quotes
- Auto talking points (copy / print)

## Ops activity desk (`/ops`)

Operational feed: who did what (demo, assessment, feedback, contact, support). Not project/incident workloads.

| Pillar | Examples |
|--------|----------|
| **Activity overview** | Volume + latest client signals + health |
| **Client activity feed** | Filterable feed — deep edit stays in CRM |
| **Reports** | Pull full slices + CSV (packet 23b) |
| **Accounts** | Plan / seats / suspend (packet 23c) |
| **Support** | Context packs (packet 23d) |

## What Ops is not

- Customer product desk (`/app` dashboards, projects, incidents, issues)  
- Duplicate day-to-day CRM pipeline (use Cloud CRM for record editing)  
- Marketing CMS  

## Data sources

| Signal | Source |
|--------|--------|
| Leads / feedback / contact | CRM Lead + Comments (API) |
| Assessment readiness | Lead job_title / message (score band) |
| Platform health | `/api/health` |
| Payments | Paystack / Sales Invoice (later panel) |
| Product activity | Future event log from `/app` |

## Build sequence

| Packet | Scope | Status |
|--------|--------|--------|
| **23a** | `/ops` shell + allowlist gate + activity overview | Done |
| **23e** | Executive Board brief (`/ops/executive`) — KPIs, graphs, talking points | **Active** |
| **23b** | Reports hub (filter → table → CSV) for intake/feedback | Next |
| **23c** | Account control panel (Customer / plan / status) | Later |
| **23d** | Support case pack + activity timeline | Later |
