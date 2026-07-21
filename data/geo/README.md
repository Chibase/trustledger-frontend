# Geo & socio-economic data drop

Place source files here for Version 002 ingest (packet 24a+).

## Preferred formats

- **Places:** CSV or GeoJSON with columns/properties: `code`, `name`, `level`, `parent_code`, optional `lat`, `lng`
- **Indicators:** CSV with `place_code`, `key`, `label`, `value`, `unit`, `year`, `source`

## Levels

`country` | `province` | `district` | `local_municipality` | `metro` | `traditional_council` | `ward` | `village`

Until files land, the app uses `src/data/mock/geo.ts`.
