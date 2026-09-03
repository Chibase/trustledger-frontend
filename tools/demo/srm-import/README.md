# TrustLedger SRM demo import pack

Offline package for a **staging** import of illustrative programme data (Sundays River / NCGR-B narrative).  
**Not** a customer or trial workspace seed (ADR-033). Do not present `INC-*` rows as a live matter.

Human must supply a **scoped staging API key** and explicitly approve `--run`. This pack will not import to production (`app.trustledgersrm.co.za`) unless a human sets `TRUSTLEDGER_ALLOW_PROD_IMPORT=YES`.

## Fill in (do not commit)

```bash
export BASE_URL="https://YOUR-STAGING-HOST"          # no trailing slash
export API_KEY="frappe_api_key:frappe_api_secret"    # Frappe token pair
```

Never put `API_KEY` in git, Postman exports checked into this repo, or chat.

## Layout

```
trustledger-srm-demo/
  csv/           organizations, sites, assets, inspections, incidents,
                 work_orders, evidence, users_and_roles, ledger_entries
  images/        30 royalty-free JPEGs with injected EXIF GPS + time
  TEST-KEYPAIR-DO-NOT-USE-IN-PROD/   demo ed25519 only
  import_script.py
  schema.md
  TrustLedger_SRM_Demo.postman_collection.json
```

Counts (medium): 5 orgs, 20 sites, 50 assets, 200 inspections, 30 incidents, 80 work orders, 400 evidence, 500 ledger rows, 20 users.

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Dry-run (no network)

Validates CSV counts, foreign keys, ZA GPS bounds, evidence checksums, EXIF match on 30 photos, and ledger hash/signature against the TEST public key.

```bash
python3 import_script.py --dry-run
```

Writes `acceptance_log.txt`. Expected overall: `PASS`.

## Staging run (human-approved only)

```bash
python3 import_script.py --dry-run --run --i-approve-staging \
  --base-url "$BASE_URL" --api-key "$API_KEY"
```

Create ledger rows (signed with **TEST-KEYPAIR-DO-NOT-USE-IN-PROD**):

```bash
python3 import_script.py --run --create-ledger --i-approve-staging \
  --base-url "$BASE_URL" --api-key "$API_KEY"
```

`--run` POSTs JSON to `srm_core.api.*` create methods (see `docs/FRAPPE_API_CONTRACT.md` naming). Evidence uses multipart/form-data fields `gps_lat`, `gps_lon`, `timestamp`, `checksum` plus `file` when `has_local_image=Y`. Create methods may 404 until Cloud implements them — that is expected; do not retry against production.

Users are skipped unless `--include-users` (creating Frappe User records is a separate human decision).

## TEST keypair

Folder `TEST-KEYPAIR-DO-NOT-USE-IN-PROD/` is a throwaway demo seed. Never load it in KMS or production `public_key`.

## Rebuild from the frontend repo

```bash
python3 tools/demo/srm-import/build_package.py
python3 tools/demo/srm-import/import_script.py --dry-run
python3 tools/demo/srm-import/build_package.py --zip
```

## Sample acceptance log

See `acceptance_log.sample.txt` (generated from a passing dry-run).
