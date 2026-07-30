# ZA baseline intel — what ships with South African plans

**ADR-040.** Packaging rule for SA commercial plans (Solo → Institutional) and trial workspaces sold into South Africa.

## Promise

When a South African client opens TrustLedger, **basic place intelligence is already there**. They do **not** rebuild the country’s municipalities, wards, or known traditional councils. They only add **their own situation** — projects, stakeholders, engagements, commitments, and cases.

```text
Platform (included)          Client adds (tenant-owned)
─────────────────────        ──────────────────────────
ZA place hierarchy           Projects / sites
Municipalities / metros      Stakeholders for that site
Districts / provinces        Engagements & commitments
Wards (MDB)                  Incidents / grievances
Traditional councils*        Evidence & reports
                             Custom villages / place notes
```

\* Traditional councils ship where the pack has them; national TC expansion is an enrichment packet (see Gaps).

## What is *not* included

| Do not ship | Why |
|-------------|-----|
| Sample `INC-*` / `STK-*` / fake engagements | ADR-033 — bleed risk; confuses “own data” |
| Client’s project boundaries | Only they know the site |
| Client’s CLO / contractor list | Tenant CRM |
| Stats SA socio-economic indicators as live facts | Still deferred — keep language honest |
| Full GIS / ESIP editing | V003+ |

Platform packs are **shared reference data**, not per-tenant demo seed.

## What ships today (`za-mdb-2020`)

| Level | Approx. count | Source |
|-------|---------------|--------|
| Country | 1 | Pack root |
| Province | 9 | MDB 2020 |
| District | 52 | MDB 2020 |
| Local municipality | 205 | MDB 2020 |
| Metro | 8 | MDB 2020 |
| Ward | 4 468 | MDB 2020 |
| Traditional council | 15 | Early CSV (Eastern Cape–weighted) |
| Indicators | 0 | Await Stats SA |

Runtime: `data/geo/za-mdb-2020.places.json` → `geoSeed` → `geoService` / `/app/geo` / `GeoCascadePicker`.  
Entitlement: `geoIntake` on **all** commercial plans (`src/config/entitlements.ts`).

## Plan packaging

| Plan | Baseline ZA intel | Client situation data |
|------|-------------------|------------------------|
| Solo | ✓ place fields + ZA pack | 1 project + desk cases |
| Practitioner | ✓ same | + AI / light governance on *their* cases |
| Project | ✓ same + SI modules | Full SRM on *their* stakeholders |
| Institutional | ✓ same | Multi-project / enterprise |

Sales line: *“South African municipalities, wards, and traditional councils where available — you add the project.”*

## Gaps → next data packets (not blockers for packaging)

1. **National traditional council coverage** — expand beyond the 15 seeded TCs; keep same pack schema (`level: traditional_council`).
2. **Village / locality** — optional client-authored `village` / `custom` under ward or TC.
3. **Coordinates** — enrich `lat`/`lng` for map later; not required for cascade pickers.
4. **Cloud Geo DocTypes** — optional sync; browser pack remains the launch SoT for pickers.
5. **Other SADC packs** — same schema (`na-…`, `bw-…`); only ZA is default for SA SKUs.

Regenerate ZA pack: `python scripts/ingest_za_geo.py` (see `data/geo/README.md`).

## Agent rules

1. Never empty the ZA pack for a paying/trial SA workspace to “make them start clean.”
2. Never fill a new Customer with fictional INC-*/STK-* “examples.”
3. When enriching TC/wards, append to the platform pack — do not invent per-tenant geo seed files.
4. Public copy: TrustLedger voice (ADR-039); do not over-claim national TC completeness until the pack says so.
