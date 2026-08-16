# TrustLedger user manual

**Audience:** New Plan Owners and desk users on trial or live Cloud.  
**Companion:** In-app **Setup wizard** + `/app/guide` · Video script `docs/ONBOARDING_VIDEO_SCRIPT.md`.

TrustLedger is a Social Relations Management (SRM) desk: projects, people, engagements, commitments, grievances, evidence, and reports. Your workspace starts **empty on purpose** — you seed real (or practice) data and add records as fieldwork continues.

---

## 1. How you get in

| Path | Who | What happens |
|------|-----|----------------|
| **Trial** (`/trial`) | Self-serve | 14-day own-data workspace in the browser; plan cookie set |
| **Subscribe** (`/pay`) | Paying | Paystack trial authorize or pay-now → Owner provision |
| **Live login** (`/login/live`) | Provisioned Owners / VIP | Email + password + OTP → Frappe Cloud session |
| **Invite accept** | Juniors | Join at the desk tier your Plan Owner assigned |

**Product name in the UI:** TrustLedger only.

After first entry, a **Setup wizard** opens once (unless you dismiss it). Reopen anytime from **Guide** in the nav or **Settings → User guide**.

---

## 2. The seeding spine (memorise this)

Do **not** start with Reports. Seed in this order:

```text
1. Project          → site / programme container
2. Stakeholders     → people & organisations (Project plan+)
3. Engagements      → meetings & contact (Project plan+)
4. Commitments      → promises with owners (Project plan+)
5. Incidents        → grievances / cases
6. Capture / files  → minutes & evidence (by plan)
7. Reports          → compose from saved work
```

**Solo** skips Stakeholder Intelligence modules (2–4 and Capture hub). Solo still uses Project → Incidents → Issue intake → Monthly report.

---

## 3. Left navigation (workspace map)

| Nav item | Purpose |
|----------|---------|
| **Dashboard** | Activity pulse — projects and cases at a glance |
| **Capture** | Minutes / registers with field templates → extract → apply (Project+) |
| **Engagements** | Log meetings and consultations (Project+) |
| **Commitments** | Promise board and statuses (Project+) |
| **Intelligence** | ESG / indicator cards (Project+) |
| **Stakeholders** | SRM registry (Project+) |
| **Projects** | Light project list and detail |
| **Incidents** | Grievance / case desk |
| **Report issue** | Guided field intake |
| **Reports** | Activity + report packs (monthly / executive / board by plan) |
| **Guide** | This manual’s in-app checklist + reopen wizard |
| **Settings** | Plan, seats, desk privileges, media, entitlements |

If a module is missing, it is usually a **plan gate**, not a broken screen. Upgrade paths appear on locked features.

---

## 4. First-week setup (recommended)

### Day 1 — Container

1. Open **Projects**. Rename or edit “My first project” (trial) or create one with the real site name.  
2. Add place / ward context when fields are available.  
3. Keep count small (Solo = 1 active project).

### Day 1–2 — People (Project+)

1. Open **Stakeholders**.  
2. Add ~5 people you already meet this week (community, contractor, client, liaison).  
3. Prefer five named humans over fifty empty rows.

### Ongoing — Contact & promises (Project+)

1. After each meeting, log an **Engagement** linked to project + stakeholders. Prefer the **Meeting minutes** or **Attendance register** template (Capture hub, or `/resources`) so names and actions map on first paste.  
2. Promote promises to **Commitments** with an owner and status.  
3. Update commitment status as fieldwork moves — do not wait for month-end.

### When harm or a complaint arrives

1. Open **Incidents** → create a case on the project.  
2. Record what happened, who is affected, urgency.  
3. If **AI Assist** is on your plan: read the suggestion → edit → **Apply** → **Save**. AI never writes the official record alone.  
4. Attach evidence (photos, registers) within your plan’s media quota.

### Reporting cycle

1. Open **Reports** only after the desk has activity.  
2. Start with the **Monthly operational** pack.  
3. Higher plans unlock Executive and Board packs.  
4. Review before sharing externally. Empty reports mean empty desk work — seed more, do not invent fiction.
5. On a report presentation, report library item, or case desk, use **Discussion & feedback** to leave feedback, request information, or propose a meeting. Given and responded times are stamped (with your plan). Meeting proposals capture a calendar item; Project+ can also create a draft Engagement.

---

## 5. Daily loop (after first seed)

```text
Meet → Engagement
Promise → Commitment
Complaint → Incident + evidence
Week / month → Report
Anytime → refine Stakeholders & Project
```

Stop batch-loading after the first seed. Put TrustLedger on the agenda of the next site meeting.

---

## 6. AI Assist rules

- Pattern: **suggest → human apply → save**  
- Never claim or expect autonomous grievance closure  
- Solo has **no** AI Assist — upgrade to Practitioner for that step-up  

---

## 7. Plans (feature boxes)

| Plan | Seats | What you get |
|------|-------|----------------|
| **Solo** | 1 | Essential desk, 1 project, monthly report — no AI / SI |
| **Practitioner** | 1 (owner) | + AI Assist, light governance, more media |
| **Project** | Owner + juniors | + Capture, Stakeholders, Engagements, Commitments, SI |
| **Institutional** | Custom | Programme / board depth — sales-scoped |

Details: `docs/SOLO_PLAN.md`, `docs/ACCESS_MODEL.md`, `docs/PLATFORM_STRATEGIC_BRIEF.md`.

---

## 8. Trial vs live data

| Mode | Data lives in | Note |
|------|----------------|------|
| **Trial** | Browser org store | Empty of sample INC-*; your seed only |
| **Live** | Frappe Cloud | Empty Cloud stays empty until you create records |
| Sample `/demo` | Retired | Use `/product` then `/trial` |

---

## 9. Seats & Settings (Plan Owner)

- Only the **Plan Owner** invites juniors (not on Solo / Practitioner by default).  
- Invitees get a **lower** desk tier than the Owner.  
- **Settings** also holds media library, report pack access, and capability toggles (within your plan).  

---

## 10. Getting help

- In-app **Support** / **Feedback** drawers (shell)  
- Marketing **Contact** → Vercel form → Frappe CRM Lead  
- Operator walkthrough: book via Contact  
- Video production script: `docs/ONBOARDING_VIDEO_SCRIPT.md`  

---

## 11. What not to expect (honest limits)

- No Stats SA live certified feeds yet  
- No native offline mobile app  
- No public community portal yet  
- No auto-resolve by AI  
- Media storage is capped by plan on purpose  

---

*Resolution you can audit.*
