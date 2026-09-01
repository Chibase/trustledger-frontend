# CSV schema (stable IDs)

Illustrative **TrustLedger** SRM demo pack. Not a customer workspace seed (ADR-033).

| File | Count | Primary key |
|------|------:|-------------|
| organizations.csv | 5 | `org_id` `ORG-0001`… |
| sites.csv | 20 | `site_id` `SITE-0001`… |
| assets.csv | 50 | `asset_id` `ASSET-0001`… |
| inspections.csv | 200 | `inspection_id` `INSP-0001`… |
| incidents.csv | 30 | `incident_id` `INC-0001`… |
| work_orders.csv | 80 | `work_order_id` `WO-0001`… |
| evidence.csv | 400 | `evidence_id` `EVID-0001`… |
| users_and_roles.csv | 20 | `user_id` `USER-0001`… |
| ledger_entries.csv | 500 | `ledger_id` `LGR-0001`… |

## Foreign keys

- `sites.org_id` → organizations
- `assets.site_id` → sites; `assets.org_id` → organizations
- `users_and_roles.org_id` → organizations
- `inspections.site_id` → sites; `asset_id` → assets; `inspector_id` → users
- `incidents.site_id` → sites; `org_id` → organizations; `reported_by` → users
- `work_orders`: `org_id`, `site_id` required; `asset_id` / `incident_id` / `inspection_id` optional (empty allowed)
- `evidence.parent_id` → inspections or incidents (`parent_type`)
- `ledger_entries.entity_id` → the matching entity table; `actor_id` → users

GPS must fall inside South Africa bounds used by `import_script.py` (lat −35…−22, lon 16…33).
