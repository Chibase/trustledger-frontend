# What I did

Could not create a live plan in the Chibase TrustLedger dashboard from this environment: no Owner session, and the brief forbids connecting to production. VIP in this product is complimentary Institutional Cloud access (`VIP Pilot — …`), not a clonable data template.

Delivered the **fallback**: a complete offline package `trustledger-srm-demo.zip` that mirrors VIP Owner workflow (private project, modules, roles, dashboards, snapshot/clone instructions) and seeds the specified medium synthetic dataset.

## Built

- 9 UTF-8 CSVs with exact headers and stable IDs (hero rows match the brief: `SITE-014`, `ASSET-210`, `INSP-1001`, `INC-302`, `WO-075`, `EVID-0099`).
- 30 unique JPEGs in `images/` with EXIF GPS + `DateTimeOriginal` aligned to the primary evidence rows (hero: −33.0002, 25.7001 @ 2026-08-01 09:17:00). Remaining 370 evidence rows reuse those files with plausible nearby GPS.
- 500 ledger rows, genesis `prev_hash=NULL`, SHA-256 chain, Ed25519 signatures (`scripts/ledger_crypto.py` + `keys/`).
- Import client: `scripts/import_srm_demo.py` (`--dry-run`, `--execute`, `--create-ledger-locally`) and bash wrapper.
- Postman collection with `/api/plans`, per-entity POSTs, multipart evidence upload, `/api/ledger`, and current Cloud `TL Project` / `TL Incident` / `upload_file` examples.
- Dashboards JSON + GeoJSON; HTML/Jinja PDF templates; 12–15 min runbook; cheat sheet; VIP UI import steps.

## Not done (blocked)

- Live URL `https://app.trustledger.co.za/...` for the plan, snapshot, and SANRAL clone — needs Chibase `BASE_URL` / `API_KEY` / Owner login.
- Pixel-identical VIP enterprise widgets that are not in this frontend repo (none found beyond Institutional packaging). Substituted Field Ledger dashboards (Executive Summary, Incident Map, Audit Trail Viewer) using TrustLedger design tokens.

## Acceptance

`python3 scripts/import_srm_demo.py --dry-run` → **PASS**. Log: `logs/dry-run.log`.
