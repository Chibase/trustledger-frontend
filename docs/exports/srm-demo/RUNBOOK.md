# Demo runbook — 12 to 15 minutes

**Plan:** TrustLedger SRM — Demo: Consolidated Evidence  
**Story:** Scattered tools (WhatsApp photos, Excel logs, unmarked PDFs) → one evidence-backed, ledgered SRM.  
**Declare up front:** illustrative / synthetic Eastern Cape corridor. No real PII.

Open as Plan Owner. Hide `/ops`. Cheat sheet: `CHEATSHEET.md`.

---

### 0:00–1:30 — Hook (pain)

**On screen:** Owner dashboard (unpinned clutter optional) or this plan’s Executive Summary.

**Say:** “Most programmes do not lack inspections. They lack a single place where the photo, the GPS, the work order, and the audit hash agree. Today that trail is rebuilt at month-end.”

**Pain points to name:** single-source, evidence-backed, immutable ledger, faster decisions, offline sync.

**Exit:** “We will follow one culvert on the R72 from inspection to closure recommendation — in one desk.”

---

### 1:30–4:00 — Single source (the spine)

| Click | ID |
|-------|-----|
| Organisation | `ORG-001` Coastal District Municipality |
| Site | `SITE-014` R72 Bridge 3 - West |
| Asset | `ASSET-210` Culvert CLV-R72-210 (Fair, 2012) |

**Say:** “Five organisations, twenty sites, fifty assets — not a second spreadsheet. The municipality, the implementing agent, and the trust share the same site register.”

**Talk track — single-source:** “If legal, the CLO, and the contractor each keep a copy, you do not have a register. You have a dispute.”

---

### 4:00–7:00 — Evidence-backed inspection

| Click | ID |
|-------|-----|
| Inspection | `INSP-1001` 2026-08-01T09:15:00Z score **72** Completed |
| Evidence | `EVID-0099` `culvert_block_20260801.jpg` |

Show EXIF: GPS **−33.0002, 25.7001**, time **09:17Z**, checksum in the CSV.

**Say:** “The inspector (USER-INS-01) captured a partial blockage. The photo is not a WhatsApp crop — it carries GPS, time, and a SHA-256 of the bytes. Offline sync is how that row gets here when the R72 has no signal; the desk still stores the same checksum.”

**Talk track — evidence-backed:** “A picture without a place and a time is a story. This is a record.”

**Optional:** open `INSP-1015` (follow-up, scour severe) and `INSP-1042` (score 96, recent) to show the register is not one hero row.

---

### 7:00–10:00 — Faster decisions (incident → work order)

| Click | ID |
|-------|-----|
| Incident | `INC-302` High / Open — road washed-out over culvert |
| Work order | `WO-075` due 2026-08-10, R15 000, assigned `USER-CTR-01` |
| Contrast | `INC-304` Investigating · `WO-003` Overdue |

**On screen:** Incident Map dashboard — click `INC-302` (SITE-014). Heatmap by severity.

**Say:** “Public reporter logs the wash-out the next afternoon. The manager does not start a new Excel. They raise WO-075 on the same asset. The map is the queue, not a slide.”

**Talk track — faster decisions:** “The question in the room is not ‘who has the photo?’ It is ‘is the lane closed and is the temporary repair dated?’”

---

### 10:00–13:00 — Immutable ledger (audit)

**On screen:** Audit Trail Viewer. Search `EVID-0099`.

| Ledger | Action |
|--------|--------|
| `LGR-5337` | create inspection `INSP-1001` |
| `LGR-5338` | create evidence `EVID-0099` — `prev_hash` equals `LGR-5337.current_hash` |

Verify signature with `keys/ledger_ed25519_public.pem` (demo key).

**Say:** “Import did not skip the trail. Each create/update is SHA-256 chained and Ed25519-signed. If someone swaps the JPEG, the checksum and the chain disagree.”

**Talk track — immutable ledger:** “We are not selling a public blockchain. We are selling an operational trail a third party can recompute.”

---

### 13:00–15:00 — Close (proof pack + clone)

1. Executive Summary KPIs: open incidents, overdue work orders, % assets inspected in 30 days, average inspection score (`dashboards/kpis.json`).
2. Open `reports/incident_evidence_report.html` — incident list, embedded image, hashes. Print to PDF.
3. “This workspace is private. Snapshot **Demo baseline (master)**. Client clone **Demo — SANRAL** changes organisation labels only — the IDs stay stable so the runbook still works.”

**Close line:** “When the panel asks how you prove the culvert was blocked on the first of August, you open TrustLedger — not a zip of unmarked photos.”

---

## Timing if you only have 12 minutes

Skip INSP-1015/1042 and the PDF. Keep SITE-014 → INSP-1001 → EVID-0099 → INC-302 → LGR-5337/5338.
