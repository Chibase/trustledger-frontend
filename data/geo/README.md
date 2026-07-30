# Geo & socio-economic packs (Version 002)

**Packaging (ADR-040):** South African plans ship with the **ZA baseline place pack**. Clients add project/situation data only — see `docs/ZA_BASELINE_INTEL.md`.

Pre-installed **platform reference** data ships as `*.places.json` packs (not per-tenant demo seed). The product model is **multi-country**: drop another pack (e.g. `na-…places.json`, `bw-…places.json`) beside the ZA file — same schema. Default for SA SKUs: `za-mdb-2020`.

## Current pack

| File | Content |
|------|---------|
| `za-mdb-2020.places.json` | ZA country → 9 provinces → 52 districts → 213 munis/metros → **4 468 wards** + **15 traditional councils** (partial; expand nationally) |
| `raw/traditional_councils_frappe_import.csv` | Source CSV |

Regenerate ZA pack:

```bash
python scripts/ingest_za_geo.py
```

(expects the MDB xlsx + councils CSV in your Downloads folder)

## Schema (per pack)

```json
{
  "pack": { "id", "countryCode", "countryName", "label", "levels", "sources", "notes" },
  "places": [{ "id", "code", "name", "level", "parentId", "countryCode", "packId", "lat?", "lng?", "meta?" }],
  "indicators": [{ "placeId", "key", "label", "value", "unit", "year?", "source?" }]
}
```

`indicators` is empty until Stats SA (or peer-country) socio-economic CSVs arrive — then append to the same pack file.

## Levels

`country` | `province` | `region` | `district` | `local_municipality` | `metro` | `traditional_council` | `ward` | `village` | `custom`

## Runtime

- Load: `src/lib/geoSeed.ts` → `geoService`
- UI: `/app/geo`, `GeoCascadePicker` on intake / cases
- Entitlement: `geoIntake` on all commercial plans
