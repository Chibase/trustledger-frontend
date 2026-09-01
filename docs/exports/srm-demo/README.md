# TrustLedger SRM — Demo: Consolidated Evidence

Offline-ready import / demo package. **Synthetic data only** (no real PII).  
Eastern Cape-like coordinates (lat −34.5…−31.5, lon 24.0…29.0).

| Field | Value |
|-------|--------|
| Plan name | **TrustLedger SRM — Demo: Consolidated Evidence** |
| Description | Demo plan to show consolidation of scattered tools into one evidence-backed SRM with immutable ledgered audit trail. |
| Visibility | Private to the Chibase account (do not make public) |
| Snapshot | `Demo baseline (master)` |
| Example clone | `Demo — SANRAL` (organisation names only) |

This pack does **not** call production. Live plan URLs require Chibase `BASE_URL` + `API_KEY` (or a VIP Owner session). Until those are supplied, use dry-run + UI steps below.

## What “VIP-style” means here

In TrustLedger Cloud, **VIP** is complimentary **Institutional** packaging (`VIP Pilot — {Organisation}`), not a clonable spreadsheet template. The same Owner workflow VIP guests already use is:

1. Live login as Plan Owner (`/login/live`) on a VIP / Institutional workspace.
2. **Projects → New** (or `POST /api/app/projects` / `TL Project` resource).
3. Seed cases and evidence on that project (`TL Incident`, `TL Evidence`, file upload).
4. Pin the project, then duplicate / snapshot for a client-named clone.

This package reproduces that **structure and UX intent** (modules, roles, three dashboards, evidence + ledger) and supplies the medium dataset the current product DocTypes do not yet store (organisations, sites, assets, inspections, work orders, chained ledger). Map the hero trail onto `TL Project` / `TL Incident` / `TL Evidence` using `payloads/cloud_vip_mapping.json`.

## Contents

```
data/*.csv              UTF-8 CSVs (headers exact as specified)
images/                 30 JPEG placeholders with EXIF GPS + DateTimeOriginal
keys/                   Ed25519 test keypair (NOT for production)
scripts/                generate + validate/import (Python 3.10+)
postman/                Postman collection + curl twins
dashboards/             Executive Summary, Incident Map (GeoJSON), Audit Trail
reports/                HTML + Jinja PDF templates
payloads/               plan.json, entities.json, Cloud mapping, manifest
logs/dry-run.log        acceptance output
RUNBOOK.md              12–15 minute presentation script
CHEATSHEET.md           quick-jump IDs
```

### Dataset sizes

| File | Rows |
|------|------|
| organizations.csv | 5 |
| sites.csv | 20 |
| assets.csv | 50 |
| inspections.csv | 200 |
| incidents.csv | 30 |
| work_orders.csv | 80 |
| evidence.csv | 400 (30 unique filenames; remainder reuse those files) |
| users_and_roles.csv | 7 |
| ledger_entries.csv | 500 chained + signed |

Hero spine (quick-jump): `ORG-001` → `SITE-014` → `ASSET-210` → `INSP-1001` → `EVID-0099` → `INC-302` → `WO-075`.

## Fill these before any live import

| Variable | Where | Example |
|----------|--------|---------|
| `TRUSTLEDGER_BASE_URL` | env / `--base-url` | `https://app.trustledger.co.za` (sandbox Customer only) |
| `TRUSTLEDGER_API_KEY` | env / `--api-key` | Frappe `token key:secret` or Bearer |
| `TRUSTLEDGER_PLAN_ID` | env / `--plan-id` | `PRJ-SRM-DEMO-001` after UI create |
| `TRUSTLEDGER_CUSTOMER` | env / `--customer` | `VIP Pilot — Chibase` |

**Do not** use credentials you were not given. **Do not** import this fiction into a paying customer tenant.

## Platform settings (modules to enable)

Match VIP / Institutional as closely as the tenant allows:

- Data Collection (mobile + web forms)
- Evidence / Attachments (image + EXIF/GPS)
- Ledger / Audit Trail (immutable entries, hashing, signatures)
- Mapping / GIS (GeoJSON, Leaflet)
- Workflows & Approvals (incident → work order)
- Reporting & Dashboards (PDF export)
- Integrations / API & CSV import
- Offline sync for mobile inspectors (if the desk exposes it)

Roles (CSV `users_and_roles.csv`): Demo Admin, Inspector Mobile, Project Manager, Auditor, External Contractor, Public Reporter, Viewer. Invite desks in Settings using mock `@example.local` addresses only.

## Create the plan in the UI (when `/api/plans` does not exist)

1. Sign in as Plan Owner on the Chibase VIP workspace (`/login/live`).
2. Open **Projects**. Create:
   - Name: `TrustLedger SRM — Demo: Consolidated Evidence`
   - Summary: the description above
   - Municipality: Coastal District Municipality (synthetic)
   - Status: Active
3. **Pin / favourite** the project on the Owner dashboard.
4. **Snapshot / duplicate** → name `Demo baseline (master)`.
5. Duplicate again → rename organisations only → `Demo — SANRAL`.
6. Recreate the three dashboards from `dashboards/*.json` (see that folder’s `recreate_ui` arrays). Import `dashboards/incident_map.geojson` into the map widget.
7. Upload `images/*.jpg` as evidence on `INC-302` / inspection notes. CSV checksums must match file bytes.
8. If Cloud does not auto-write ledger rows, POST `data/ledger_entries.csv` to `/api/ledger` or keep the CSV as the demo SoT and show Audit Trail Viewer from `dashboards/audit_trail_viewer.json`.

Step-by-step with current DocTypes: [`docs/VIP_UI_IMPORT.md`](docs/VIP_UI_IMPORT.md).

## Import script

Python 3.10+ (3.12 used here). Optional: `pip install pillow piexif cryptography` only if you regenerate images/keys.

```bash
# 1) Validate referential integrity, GPS bounds, checksums, hash chain, signatures
python3 scripts/import_srm_demo.py --dry-run

# or
./scripts/import_srm_demo.sh --dry-run

# 2) Print curl examples (does not hit the network)
./scripts/import_srm_demo.sh --curl-examples

# 3) Execute only against a sandbox after filling env vars
export TRUSTLEDGER_BASE_URL="https://YOUR_SANDBOX"
export TRUSTLEDGER_API_KEY="REPLACE_ME"
export TRUSTLEDGER_PLAN_ID="PRJ-SRM-DEMO-001"   # omit to POST /api/plans first
python3 scripts/import_srm_demo.py --execute --create-ledger-locally
```

`--dry-run` reports counts (5/20/50/200/30/80/400/7/500), unique images ≥ 30, 500 chain links, 500 Ed25519 verifications.

`--create-ledger-locally` writes `payloads/ledger_local_recomputed.json` for platforms that skip ledger generation on CSV import.

`--execute` POSTs `/api/plans` then sample rows to `/api/{organization,site,asset,inspection,incident,work_order,evidence,ledger}`. If `/api/plans` 404s, create the project in the UI and pass `--plan-id`. Common errors:

| Message | Cause |
|---------|--------|
| Missing CSV | Run `python3 scripts/generate_dataset.py` |
| GPS outside Eastern Cape demo bounds | Lat/lon drifted; regenerate, do not hand-edit |
| checksum mismatch | Image bytes changed after CSV write |
| signature verification failed | Public key does not match `keys/` used at generate time |
| Cannot reach URL | Wrong `BASE_URL` or no network — stay in dry-run |

Postman: `postman/TrustLedger_SRM_Demo.postman_collection.json`. Multipart example posts `gps_lat`, `gps_lon`, `timestamp`, `checksum` with the JPEG.

## Ledger canonicalisation (hash + signature)

`canonical_entity_representation` = UTF-8 JSON, **sorted keys**, compact separators `(",", ":")`, `ensure_ascii=False` (`scripts/ledger_crypto.py`).

```
current_hash = "sha256:" + SHA256(prev_hash + canonical + timestamp + actor_id)
```

Genesis `prev_hash` is stored as `NULL` and hashed as 64 zero hex characters. Each next `prev_hash` equals the previous `current_hash`. Ed25519 signs the UTF-8 `current_hash`; CSV field is `sig:` + base64.

Verify with `keys/ledger_ed25519_public.pem`. **Replace this test keypair before any production use.**

## Dashboards & report

| Dashboard | File |
|-----------|------|
| Executive Summary | `dashboards/executive_summary.json` (KPIs as of 2026-09-01) |
| Incident Map | `dashboards/incident_map.json` + `incident_map.geojson` |
| Audit Trail Viewer | `dashboards/audit_trail_viewer.json` (includes a 10-row sample chain) |

PDF: open `reports/incident_evidence_report.html` (images relative to `../images/`) → Print → Save as PDF. Templated variant: `incident_evidence_report.j2`.

## Snapshot / clone checklist

- [ ] Plan created, private, pinned
- [ ] Modules above enabled
- [ ] Dry-run PASS (`logs/dry-run.log`)
- [ ] Hero IDs searchable
- [ ] 30 images in Evidence; EXIF GPS/time match `EVID-0099` and the other unique files
- [ ] Audit Trail shows `LGR-5337` → `LGR-5338` (INSP-1001 → EVID-0099)
- [ ] Snapshot named **Demo baseline (master)**
- [ ] Clone **Demo — SANRAL** (names only)
- [ ] Runbook + cheat sheet in the plan documents

## Regenerating

```bash
python3 scripts/generate_dataset.py
python3 scripts/import_srm_demo.py --dry-run --create-ledger-locally
```

Deterministic except the Ed25519 key: if `keys/ledger_ed25519_private.pem` exists it is reused; delete keys to mint a new pair (rewrites all signatures).

## Integrity

Illustrative programme data. Do not present `INC-*` / `ORG-*` as a live customer matter. Public voice remains **Trust** / **TrustLedger** (no stack-vendor names in the room).
