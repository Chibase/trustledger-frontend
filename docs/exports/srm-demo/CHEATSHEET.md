# Quick-jump cheat sheet (1 page)

**Plan:** TrustLedger SRM — Demo: Consolidated Evidence  
**Synthetic.** No real PII. Corridor: Eastern Cape-like GPS.

## Spine (tell this story)

| Step | ID | What to show |
|------|-----|----------------|
| Org | `ORG-001` | Coastal District Municipality |
| Site | `SITE-014` | R72 Bridge 3 - West (−33.0002, 25.7001) |
| Asset | `ASSET-210` | Culvert CLV-R72-210 · Fair · 2012-05-01 |
| Inspection | `INSP-1001` | 2026-08-01T09:15:00Z · score 72 · partial blockage |
| Photo | `EVID-0099` | `culvert_block_20260801.jpg` · 09:17Z · USER-INS-01 |
| Incident | `INC-302` | High · Open · wash-out · USER-PUB-01 · 2026-08-02T14:30:00Z |
| Work order | `WO-075` | Open · due 2026-08-10 · R15 000 · USER-CTR-01 |
| Ledger | `LGR-5337` → `LGR-5338` | INSP-1001 create → EVID-0099 create (hash chain) |

## Three inspections

| ID | Asset | When | Score | Why jump here |
|----|--------|------|-------|----------------|
| **INSP-1001** | ASSET-210 | 2026-08-01T09:15:00Z | 72 | Hero blockage + photo |
| **INSP-1015** | ASSET-215 | 2026-07-22T11:45:00Z | 68 | Follow-up · scour severe |
| **INSP-1042** | ASSET-242 | 2026-08-06T18:00:00Z | 96 | Recent high score (30-day KPI) |

## Two incidents

| ID | Site | Severity | Status | One-liner |
|----|------|----------|--------|-----------|
| **INC-302** | SITE-014 | High | Open | Road washed-out over culvert |
| **INC-304** | SITE-004 | Medium | Investigating | Scour at outlet apron |

## Two work orders

| ID | Links | Due | Status | Notes |
|----|-------|-----|--------|-------|
| **WO-075** | INC-302 / ASSET-210 | 2026-08-10 | Open | Temporary repair to re-open lane |
| **WO-003** | INC-303 / ASSET-203 | 2026-07-30 | Overdue | Place temporary barriers |

## One audit chain

Search **EVID-0099** (or **INSP-1001**).

1. `LGR-5337` create `inspection/INSP-1001`  
   `current_hash` = `sha256:a13ca8bb0bd800cd263e4ee63a700b74bb45c0c6bfe00f2351757bff8eeca7d7`
2. `LGR-5338` create `evidence/EVID-0099`  
   `prev_hash` = previous current · notes: Auto ledger for evidence upload

Public key: `keys/ledger_ed25519_public.pem`  
Users: `USER-ADMIN-01` `USER-INS-01` `USER-MGR-01` `USER-AUD-01` `USER-CTR-01` `USER-PUB-01` `USER-VIEW-01`

## Pain-point one-liners

| Pain | Line |
|------|------|
| Single-source | One site register — not three spreadsheets |
| Evidence-backed | Photo + GPS + time + checksum on the case |
| Immutable ledger | prev_hash → current_hash, signatures verify |
| Faster decisions | Map click → incident → work order, not a status meeting |
| Offline sync | Inspector row still hashes the same bytes after sync |
