# Version 002 — hastened build roadmap

**North star:** TEDS Volume 1 MVP domains that close the market gap.  
**Policy:** Soft launch may wait until V002 core is credible (ADR-023).  
**Active packet:** **24a — Geo foundation** (then 24b Stakeholders).

## Priority order (do not reshuffle without reason)

```text
24a Geo foundation (SA hierarchy + link fields + ingest hook)
  → 24b Stakeholders registry
  → 24c Engagements
  → 24d Commitments
  → 24e Stronger grievance (Frappe lifecycle)
  → 24f Reports + executive packs
  → 24g Intelligence / ESG indicators + stronger AI
```

Geo first unlocks your existing location + socio-economic datasets as a **selling proof**, then stakeholders/engagements/commitments attach to place.

## Packets

| Packet | Scope | Frontend | Frappe / data | Target |
|--------|-------|----------|---------------|--------|
| **24a** | Geo foundation | Types, mock SA tree, `/app/geo`, place picker fields | DocType / JSON ingest for wards + socio-econ keys | **Scaffolded** |
| **24b** | Stakeholders | List/detail/create (mock→live) | `SRM Stakeholder` + org link | **List scaffolded** |
| **24c** | Engagements | Meetings list + note capture | Extend meeting notes → Engagement DocType | +1–2 wks |
| **24d** | Commitments | Register + status board | Commitment DocType + link to stakeholder/project | +1–2 wks |
| **24e** | Stronger grievance | Status machine UI + verify/close | Incident workflow states on Cloud | +2 wks |
| **24f** | Reports | `/app/reports` packs + CSV/print | Aggregate APIs | +1–2 wks |
| **24g** | Intelligence / ESG | Indicator cards + AI briefs on live indicators | Indicator store + Grok briefs | +2–3 wks |

**Aggressive solo calendar:** ~10–14 weeks to a **demoable V002 core** (mock+ingest OK). Faster if geo/socio-econ files land in week 1 and Frappe DocTypes are created in parallel on Cloud.

## What you provide (unblocks speed)

1. Geo files (wards / municipalities / coordinates) — preferred GeoJSON or CSV with codes  
2. Socio-economic indicators for SA (CSV: area code + metrics)  
3. Priority municipality/wards for the first demo dataset (e.g. one metro + sample wards)

Drop files under `data/geo/` (git-lfs or private store if large) and tell the agent path.

## Public expectation copy (reuse)

**Website / video:**  
“TrustLedger **Version 001** is the live resolution desk. **Version 002** adds the Stakeholder Intelligence core competitors miss — registry, engagements, commitments, South African geo & socio-economic depth, and executive ESG packs.”

**Do not say:** “Full ESIP / GIS editing / public portal available today.”
