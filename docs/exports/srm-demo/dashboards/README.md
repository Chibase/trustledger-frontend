# Dashboards

Import these JSON files if the tenant supports dashboard-as-code. Otherwise follow each file’s `recreate_ui` array in a VIP / Institutional workspace.

| File | Dashboard |
|------|-----------|
| `executive_summary.json` | Four KPIs + saved filters (Open+High, overdue WO, SITE-014) |
| `incident_map.json` | Leaflet + heatmap; GeoJSON in `incident_map.geojson` |
| `audit_trail_viewer.json` | Search by entity id; sample 10-row chain + evidence metadata |
| `kpis.json` | Computed as of 2026-09-01Z from the CSVs |

Theme tokens match `docs/DESIGN_SYSTEM.md` (ink / trust / amber / danger).

Click behaviour on the map: incident popup → evidence gallery → ledger hashes for that `entity_id`.
