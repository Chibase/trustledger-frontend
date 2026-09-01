# Acceptance tests — 2026-09-01

Command: `python3 scripts/import_srm_demo.py --dry-run --create-ledger-locally`  
Result: **PASS**  
Machine log: `logs/dry-run.log`

## Counts

| Entity | Expected | Got |
|--------|----------|-----|
| organizations | 5 | 5 |
| sites | 20 | 20 |
| assets | 50 | 50 |
| inspections | 200 | 200 |
| incidents | 30 | 30 |
| work_orders | 80 | 80 |
| evidence | 400 | 400 |
| users_and_roles | 7 | 7 |
| ledger_entries | 500 | 500 |
| unique image filenames | ≥30 | 30 |
| JPEG files on disk | ≥30 | 30 |
| ledger chain links | 500 | 500 |
| Ed25519 signatures verified | 500 | 500 |

## Referential integrity

site.org_id, asset.site_id, inspection.asset_id, incident.site_id, work_order.incident_id/asset_id, evidence.parent_id — all resolve. GPS inside lat −34.5…−31.5, lon 24.0…29.0. Evidence checksums match file bytes.

## Hero fixtures

ORG-001, SITE-014, ASSET-210, INSP-1001, INC-302, WO-075, EVID-0099 present.

## Ten random ledger chains

All `chain_link_ok`, `signature_ok`, `hash_matches_csv` (public key `keys/ledger_ed25519_public.pem`). IDs: LGR-5166, LGR-5486, LGR-5078, LGR-5203, LGR-5334, LGR-5025, LGR-5038, LGR-5421, LGR-5275, LGR-5049. Full prev/current hashes in `logs/dry-run.log` → `sample_chains`.

Presenter chain (not random): LGR-5337 (INSP-1001) → LGR-5338 (EVID-0099).

## Live execute

Skipped (no sandbox credentials). See `logs/execute.skipped.txt`.

## Dashboards / runbook

`dashboards/*.json` present with `recreate_ui` steps. `RUNBOOK.md` is 12–15 minutes with quick-jump IDs. `CHEATSHEET.md` lists 3 inspections, 2 incidents, 2 work orders, 1 audit chain.
