# MEL-2 — grievance root-cause tags

**Packet:** MEL-2. **Not** a standalone product (ADR-054). **Not** `addon_mel`.  
**Not in this packet:** Learn & Adapt records (MEL-3), AI retrospectives (MEL-4).

## What it is

A closed **operational** taxonomy for why a grievance happened. Distinct from complaint **nature** (dust, employment, …).

Required before stamping **Investigated** or **Resolved**. Historical cases that already have those stamps are not rewritten. Verify & close of an already-resolved case still works without a tag.

The tag is a **watch** for M&E. It is **not** a trust-movement cause (TE-12). No auto-escalate, no auto-close.

## Taxonomy

| Id | Label |
|----|--------|
| `information_gap` | Information / communication gap |
| `unmet_commitment` | Unmet or delayed commitment |
| `process_failure` | Process or procedure failure |
| `contractor_performance` | Contractor / subcontractor performance |
| `consultation_gap` | Insufficient consultation |
| `access_eligibility` | Access, eligibility, or list dispute |
| `livelihood_impact` | Compensation / livelihood impact |
| `protocol_breach` | Cultural / traditional protocol breach |
| `control_failure` | Safety or environmental control failure |
| `third_party` | Third party / outside project control |
| `other` | Other (short note required) |

## Cloud

`TL Incident.root_cause` (Data) and `root_cause_note` (Small Text). PUT omits both unless the client sent a tag. List fetch tries MEL fields, then stage stamps, then core — missing Custom Fields must not drop lifecycle stamps.

Empty Cloud stays empty: live lists overlay local extras onto **Cloud ids only**.

Ops **Check/Create product DocTypes** adds the Custom Fields on existing `TL Incident`.

## Where in the app

| Surface | Capability |
|---------|------------|
| Case desk process actions | Picker + Save root cause; Advance to Investigate/Resolve blocked until valid |
| `/app/incidents` | Root-cause column + mix of **tagged** cases only |

Themba does not run desk M&E. Activity reports still use `reportComposer`.
