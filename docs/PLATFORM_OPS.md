# Platform Ops — command centre

**Locked with ADR-015.**  
This is **not** a CRM and **not** the customer Plan Owner (`admin`) desk.

**Purpose:** Your control / command centre for the whole TrustLedger platform — overview, analysis, reports, support context, and account controls. Frappe CRM / Customer / Paystack remain systems of record; Ops **reads and acts**, it does not replace CRM.

## Who can enter

| Role | Access |
|------|--------|
| **Platform Owner** (you) | Full `/ops` |
| **Platform Staff** (emails you add later) | Scoped read / support (future) |
| Customer Plan Owner / demo users | **Never** |

Allowlist: `PLATFORM_OPERATOR_EMAILS` (same env as ADR-013).  
`/ops` is **always** allowlist-gated (even if customer lockdown is off).

**Entry:** `https://trustledger-frontend-pi.vercel.app/ops`  
**Login:** live TrustLedger Cloud session via `/login/live?next=/ops`, then Ops gate checks email.

## What Ops is for

Ops captures **client and visitor activity across the platform**, not customer project work.

| Pillar | Examples |
|--------|----------|
| **Activity overview** | Demos, assessments, feedback, contact, support volume + health |
| **Client activity feed** | Who did what (interest, readiness, ratings) — deep edit stays in CRM |
| **Reports** | Pull full slices: intake, feedback, assessment, support, billing (export/analysis) |
| **Accounts** | Client/Customer plan status, seats, suspend (after entitlements) |
| **Support** | Ticket/context pack for a person or org |
| **Controls** | Lockdown, feature flags, operator tools |

## What Ops is not

- Customer product desk (`/app` dashboards, projects, incidents, issues)  
- Duplicate day-to-day CRM pipeline (use Cloud CRM for record editing)  
- Marketing CMS  

**Operator login default:** allowlisted live users land on **`/ops`**, not `/app/dashboard`.

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
| **23a** | `/ops` shell + allowlist gate + overview (health + intake intel) | Active |
| **23b** | Reports hub (filter → table → CSV) for intake/feedback | Next |
| **23c** | Account control panel (Customer / plan / status) | Later |
| **23d** | Support case pack + activity timeline | Later |
