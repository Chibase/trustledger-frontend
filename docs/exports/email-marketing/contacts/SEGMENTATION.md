# Marketing segmentation (ICP)

**Canonical blast list:** Email Group **`TL Marketing`** — **21** ICP contacts (pruned from 112).

## Target industries

| Segment | Email Group | Count | Typical message angle |
|---------|-------------|------:|------------------------|
| Construction | `TL Segment Construction` | 7 | Site / contractor trust, grievances, commitments |
| Architects | `TL Segment Architects` | 7 | Design-stage stakeholder risk, project desk |
| Engineers | `TL Segment Engineers` | 3 | Technical programme evidence, reporting packs |
| Government | `TL Segment Government` | 2 | Municipal / DPW oversight, ward-to-board audit |
| Social Facilitators | `TL Segment Social Facilitators` | 1 | Community intake, engagement, CLO workflows |
| Related industries | `TL Segment Related Industries` | 1 | Academia / adjacent built-environment practitioners |

Use a **segment group** when the Newsletter copy is industry-specific.  
Use **`TL Marketing`** for general soft-launch / product updates to the full ICP.

## Removed (91)

Vendors, Quora, SaaS cold outreach, internals, smoke/payment tests, personal Gmail with no ICP signal.  
See `TL_Marketing_removed.csv` and `TL_Marketing_segmentation.csv`.

## Files

| File | Use |
|------|-----|
| `TL_Marketing_email_group_member.csv` | Full ICP master (21) |
| `TL_Segment_*_email_group_member.csv` | Per-segment imports |
| `TL_Marketing_segmentation.csv` | Keep + remove audit with reasons |
| `TL_Marketing_removed.csv` | Removals only |

## Send pattern

1. Pick audience: `TL Marketing` **or** one `TL Segment …` group.  
2. Use the matching **segment intro** template (`../SEGMENT_INTROS.md` — `TL Intro Construction`, etc.).  
3. Confirm segment **From name** + `sales@trustledgersrm.co.za` before Send.  
4. Send Test → Send.  
5. New CRM Leads: only add to `TL Marketing` + a segment when org/role matches ICP.
