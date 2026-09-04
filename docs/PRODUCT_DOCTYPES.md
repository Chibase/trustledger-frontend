# Product DocTypes (OD-2)

**Status:** Active after Step 1 Owner smoke. Create via Ops **Create product DocTypes** (preferred) or Desk → New DocType.

| DocType | Autoname | Customer link | Frontend type |
|---------|----------|---------------|---------------|
| `TL Project` | `project_code` | Yes | `src/types/project.ts` |
| `TL Incident` | `incident_code` | Yes | `src/types/incident.ts` — plus Datetime stamps `reported_at` … `closed_at` |
| `TL Evidence` | `evidence_code` | Yes | `EvidenceStub` + Attach `file` |

## APIs (this repo)

| Route | Purpose |
|-------|---------|
| `POST /api/frappe/ensure-product-doctypes` | Idempotent DocType create + incident stage Custom Fields (`dryRun` default true) |
| `GET\|POST /api/frappe/product?kind=incident` | Live list/upsert including process-stage stamps |
| `POST /api/frappe/product-smoke` | Create one project / incident / evidence under a Customer |
| `POST /api/frappe/upload-file` | Proxy to Frappe `upload_file` (session or API key) |

## Permissions

System Manager: full. Customer role: read/write/create (no delete).

## File attach

Upload via BFF → set `file` URL on `TL Evidence`. Case-desk switch from `tl-org-media` data URLs follows after smoke.

See ADR-032 / `docs/OPERATIONAL_DELIVERY.md` Step 2.
