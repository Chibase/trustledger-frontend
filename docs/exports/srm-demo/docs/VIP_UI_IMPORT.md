# VIP-style UI import (current TrustLedger Cloud)

Use this when `/api/plans` does not exist. Same path a VIP Plan Owner already uses to stand up a private project. **Sandbox / Chibase VIP Customer only.** Synthetic data — no real PII.

Target product UI: `https://trustledger-frontend-pi.vercel.app/app` (live mode) with Cloud SoT `https://app.trustledger.co.za`. Do not use retired `/demo`.

## 1. Workspace

1. Ops: complimentary VIP Customer `VIP Pilot — Chibase` (see `docs/VIP_ACCESS.md` in the product repo) **or** an Institutional Owner you already have.
2. Sign in at `/login/live` as Plan Owner.
3. Confirm Settings shows Institutional / VIP packaging (unlimited desks). Do not stamp VIP from the browser.

## 2. Create the plan (project)

1. Go to **`/app/projects`** → **New** (`?new=1`).
2. Title: `TrustLedger SRM — Demo: Consolidated Evidence`
3. Public summary: `Demo plan to show consolidation of scattered tools into one evidence-backed SRM with immutable ledgered audit trail.`
4. Municipality: Coastal District Municipality · Ward: R72 corridor (illustrative) · Status: Active.
5. Save. Copy the project code (expected `PRJ-SRM-DEMO-001` if you set it; otherwise note the generated id) into `TRUSTLEDGER_PLAN_ID`.
6. Pin / favourite on `/app/dashboard`.

Equivalent Cloud resource (API key user):

```http
POST /api/resource/TL Project
Authorization: token KEY:SECRET
```

Body: `payloads/cloud_vip_mapping.json` → `project` plus `"customer": "VIP Pilot — Chibase"`.

## 3. Modules / desks

VIP Institutional already exposes Stakeholder Intelligence, incidents, evidence, reports. Enable anything still off:

| Requested module | Closest shipped desk |
|------------------|----------------------|
| Data collection | `/app/capture` + incident forms |
| Evidence / EXIF | Incident desk attachments; upload `images/` |
| Ledger / audit | Audit Trail Viewer dashboard + `ledger_entries.csv` (full org/site/asset ledger is this pack until srm-core DocTypes land) |
| Mapping / GIS | Incident Map + `incident_map.geojson` |
| Workflows | Incident → notes; work orders live in CSV until a WO DocType exists |
| Reporting | `/app/reports` + `reports/incident_evidence_report.html` |
| CSV / API | This pack’s import script + Postman |
| Offline sync | Inspector Mobile role; field capture then sync when online |

## 4. Users (mock only)

Invite `@example.local` seats from Settings → Team (or skip invites and narrate roles from `data/users_and_roles.csv`). Do not use real personal emails.

## 5. Seed data

**Minimum live trail (VIP DocTypes today):**

1. Create `TL Incident` `INC-302` from `payloads/cloud_vip_mapping.json` → `hero_incident`.
2. Upload `images/culvert_block_20260801.jpg` via `/api/method/upload_file` or the case desk.
3. Create `TL Evidence` `EVID-0099` linked to `INC-302` (inspection parent is CSV-only until an Inspection DocType exists — put INSP-1001 in the evidence description).
4. Repeat for a handful of other incidents if you want the map populated; otherwise import GeoJSON into the dashboard widget.

**Full medium dataset:** keep CSVs as the demo SoT. `--execute` against hypothetical `/api/{entity}` when those routes exist. Until then, present CSVs + dashboards from this pack beside the live project.

## 6. Dashboards

1. New dashboard **Executive Summary** — four KPIs from `dashboards/kpis.json` / `executive_summary.json`.
2. **Incident Map** — Leaflet, center [−33.0, 26.5], import `incident_map.geojson`, heatmap by severity, click → case.
3. **Audit Trail Viewer** — search box; paste `EVID-0099`; show chain `LGR-5337` → `LGR-5338` from `audit_trail_viewer.json` `sample_chain` (or CSV).

Saved filters: Open+High incidents; overdue work orders; SITE-014 trail.

## 7. Snapshot / clone

1. Duplicate the project (or export+reimport this zip) → **Demo baseline (master)**. Pin it.
2. Duplicate again → **Demo — SANRAL**. Rename `ORG-001` display label only (e.g. “SANRAL Eastern Region — demo label”). Keep IDs so the runbook still works.
3. Do not copy this fiction into a real SANRAL tenant.

## 8. Proof

- Counts: dry-run log in `logs/dry-run.log`
- 30 images on disk with EXIF
- Ten chains in `logs/dry-run.log` → `sample_chains`
- Dashboards present
- Snapshot named and pinned
