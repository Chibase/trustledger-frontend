import type { NarrativeCaptureSource } from "@/lib/captureStore";
import type { ResourcePack } from "@/data/resources";

export type FieldTemplate = ResourcePack & {
  family: "field-template";
  captureSource: NarrativeCaptureSource;
  pasteSkeleton: string;
  mapsTo: string[];
};

const LINE = "______________________________________";
const SHORT = "____________________";

/** One attendance row — no ID number (stakeholders do not require it). */
const ATTENDANCE_PERSON_FIELDS = [
  "Initials and Surname: ______________________________________",
  "Organisation / structure: ______________________________________",
  "Contact details: ______________________________________",
  "Address: ______________________________________",
  "Signature: ______________________________________",
];

function attendancePersonSlots(count: number): string {
  return Array.from({ length: count }, (_, i) =>
    [
      `PERSON ${i + 1}`,
      "Initials and Surname: ",
      "Organisation / structure: ",
      "Contact details: ",
      "Address: ",
      "Signature: ",
      "",
    ].join("\n"),
  ).join("");
}

function attendancePersonSections(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Attendee ${i + 1}`,
    itemStyle: "field" as const,
    items: ATTENDANCE_PERSON_FIELDS,
  }));
}

/** One minutes agenda row — Item, Description, Action, Date are mandatory. */
function minutesItemFields(n: number): string[] {
  return [
    `Item ${n}: ______________________________________`,
    `Description ${n}: ______________________________________`,
    `Action ${n}: ______________________________________`,
    `Date ${n} (YYYY-MM-DD): ____________________`,
  ];
}

function minutesItemSlots(count: number): string {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return [
      `ITEM ${n}`,
      `Item: `,
      `Description: `,
      `Action: `,
      `Date (YYYY-MM-DD): `,
      "",
    ].join("\n");
  }).join("");
}

function minutesItemSections(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Agenda item ${i + 1}`,
    intro:
      i === 0
        ? "Mandatory columns: Item · Description · Action · Date. Leave blank rows unused."
        : undefined,
    itemStyle: "field" as const,
    items: minutesItemFields(i + 1),
  }));
}

export const FIELD_TEMPLATES: FieldTemplate[] = [
  {
    id: "minutes-template",
    family: "field-template",
    captureSource: "minutes",
    title: "Meeting Minutes",
    shortTitle: "Meeting minutes",
    tagline: "Project · date · time · venue · item / description / action / date",
    description:
      "Site-style minutes: project details, meeting date, time, and venue, then a mandatory agenda table (Item, Description, Action, Date). Attendance is recorded on the Attendance Register — not in these minutes.",
    audience: "Facilitators, CLOs, site managers, project teams",
    pagesHint: "PDF form · agenda table",
    version: "2026.08b",
    filename: "Meeting-Minutes.pdf",
    mapsTo: [
      "Engagement (project, date, venue, time, purpose)",
      "Commitments (action + date from agenda rows)",
      "Capture minutes narrative",
    ],
    pasteSkeleton: `MEETING MINUTES

PROJECT DETAILS
Project / site: 
Client / funder: 
Meeting title: 
Nature of meeting: (site progress / consultation / briefing / other)

MEETING
Date of meeting (YYYY-MM-DD): 
Time: 
Venue: 

Note: Attendance is recorded on the Attendance Register (do not duplicate a distribution list here).

AGENDA ITEMS
(Mandatory for each row: Item · Description · Action · Date)

${minutesItemSlots(8)}APOLOGIES
(List names only — full details on the Attendance Register)


NEXT MEETING
Date (YYYY-MM-DD): 
Time: 
Venue: 

SIGNED
Chair / facilitator: 
Date: 
`,
    sections: [
      {
        title: "Project details",
        intro:
          "Identify the programme. Do not list attendees here — use the Attendance Register.",
        itemStyle: "field",
        items: [
          `Project / site: ${LINE}`,
          `Client / funder: ${LINE}`,
          `Meeting title: ${LINE}`,
          "Nature of meeting (site progress / consultation / briefing / other): ______________",
        ],
      },
      {
        title: "Meeting",
        itemStyle: "field",
        items: [
          `Date of meeting (YYYY-MM-DD): ${SHORT}`,
          `Time: ${SHORT}`,
          `Venue: ${LINE}`,
        ],
      },
      {
        title: "Attendance note",
        intro:
          "Attendance and distribution are covered by the Attendance Register. Record apologies by name only if needed.",
        itemStyle: "field",
        items: [
          "Apologies (names only): ______________________________________",
          "________________________________________________________________",
        ],
      },
      ...minutesItemSections(8),
      {
        title: "Next meeting",
        itemStyle: "field",
        items: [
          `Date (YYYY-MM-DD): ${SHORT}`,
          `Time: ${SHORT}`,
          `Venue: ${LINE}`,
        ],
      },
      {
        title: "Sign-off",
        itemStyle: "field",
        items: [
          `Chair / facilitator: ${LINE}`,
          `Date: ${SHORT}`,
        ],
      },
    ],
  },
  {
    id: "attendance-register",
    family: "field-template",
    captureSource: "attendance",
    title: "Attendance Register",
    shortTitle: "Attendance register",
    tagline: "Nature · venue · time · named people with signature",
    description:
      "Register for community and site meetings: nature of the meeting, venue, and time, then one row per person (Initials and Surname, organisation/structure, contact details, address, signature). No ID number — stakeholder capture does not require it.",
    audience: "Meeting chairs, facilitators, site clerks",
    pagesHint: "PDF form · one person per slot",
    version: "2026.08b",
    filename: "Attendance-Register.pdf",
    mapsTo: [
      "Stakeholders (name, organisation, contact, address)",
      "Engagement attendance list",
    ],
    pasteSkeleton: `ATTENDANCE REGISTER

SESSION
Nature of the meeting: (site progress / consultation / community / briefing / other)
Project / site: 
Date (YYYY-MM-DD): 
Venue: 
Time: 

ATTENDEES
${attendancePersonSlots(10)}`,
    sections: [
      {
        title: "Session header",
        intro:
          "Capture the meeting context. No distribution list is needed on the minutes — this register is the attendance record.",
        itemStyle: "field",
        items: [
          "Nature of the meeting (site progress / consultation / community / briefing / other): ______________",
          `Project / site: ${LINE}`,
          `Date (YYYY-MM-DD): ${SHORT}`,
          `Venue: ${LINE}`,
          `Time: ${SHORT}`,
        ],
      },
      ...attendancePersonSections(10),
    ],
  },
  {
    id: "field-note",
    family: "field-template",
    captureSource: "social_intel",
    title: "Local community intelligence",
    shortTitle: "Community intel",
    tagline: "Baseline verify + LED / ESG / M&E project impact",
    description:
      "Ward surveys beside Stats SA, plus project impact: labour intake, training, local procurement (people + ZAR). Serves LED, ESG, M&E and funders from local upward. Tenant-owned — never overwrites platform packs.",
    audience: "LED, CLO, ESG, MEL, funders, community structures",
    pagesHint: "PDF form · survey + impact",
    version: "2026.08",
    filename: "Local-Community-Intelligence.pdf",
    mapsTo: [
      "Local indicators beside Stats SA / Census baseline",
      "Labour intake & wages (ZAR)",
      "Training beneficiaries & skills spend (ZAR)",
      "Local / preferential procurement (ZAR)",
      "Funder roll-up local → provincial → national / IFI",
      "Stakeholders (people mentioned)",
      "ESG / LED / M&E reporting",
    ],
    pasteSkeleton: `LOCAL COMMUNITY INTELLIGENCE
(Tenant-owned — verify Stats SA baseline + measure project impact for LED / ESG / M&E / funders)
Place / ward: 
Survey date / reporting period (YYYY-MM-DD): 
Source: (ward survey / CLO tally / contractor LED / M&E pack)

INDICATORS — baseline compare (Stats SA keys)
Households surveyed: 
Unemployment rate: 
Youth NEET (15–24): 
Households with piped water: 
Households with electricity: 
Community trust score: 

PROJECT IMPACT — labour / training / procurement (count + ZAR)
Labour intake: 
Labour wages / payroll: 
Local hire: 
Youth employed: 
Women employed: 
Jobs created (FTE): 
People trained: 
Training spend: 
Skills development spend: 
Local procurement: 
Preferential procurement: 
Local suppliers engaged: 
SME / ESD spend: 
Households benefiting: 
Local income injected: 

Or CSV:
key,value,unit,year,source,notes
# labour_intake_count,85,people,2025,LED register,
# labour_wages_zar,2100000,ZAR,2025,Payroll,
# local_procurement_zar,1500000,ZAR,2025,Procurement log,
# training_spend_zar,320000,ZAR,2025,Skills pack,
# unemployment_rate,41,%,2025,Ward household survey,

FUNDER ROLL-UP
(Local project figures sit beside municipal / provincial Stats SA baseline — report upward without overwriting platform packs.)
Audience notes (LED / ESG / M&E / funder): 

NOTES / LOCAL IMPACT


PEOPLE MENTIONED
PERSON 1
Initials and Surname: 
Organisation / structure: 
Contact details: 

PERSON 2
Initials and Surname: 
Organisation / structure: 
Contact details: 

THEMES
Theme: 
Severity: (critical / high / medium / low)
Location: 
`,
    sections: [
      {
        title: "Survey header",
        itemStyle: "field",
        items: [
          `Place / ward: ${LINE}`,
          `Survey date / reporting period (YYYY-MM-DD): ${SHORT}`,
          "Source (ward survey / CLO / LED / M&E): ______________",
        ],
      },
      {
        title: "Baseline compare (Stats SA)",
        intro:
          "Same metric names as provincial baseline where possible — verify or support Census / QLFS figures.",
        itemStyle: "field",
        items: [
          `Households surveyed: ${SHORT}`,
          `Unemployment rate: ${SHORT}`,
          `Youth NEET (15–24): ${SHORT}`,
          `Households with piped water: ${SHORT}`,
          `Households with electricity: ${SHORT}`,
          `Community trust score: ${SHORT}`,
        ],
      },
      {
        title: "Project impact — labour",
        intro: "LED / ESG employment evidence (people + payroll ZAR).",
        itemStyle: "field",
        items: [
          `Labour intake (people): ${SHORT}`,
          `Labour wages / payroll (ZAR): ${SHORT}`,
          `Local hire (%): ${SHORT}`,
          `Youth employed: ${SHORT}`,
          `Women employed: ${SHORT}`,
          `Jobs created (FTE): ${SHORT}`,
        ],
      },
      {
        title: "Project impact — training",
        intro: "Skills / M&E beneficiaries and spend.",
        itemStyle: "field",
        items: [
          `People trained: ${SHORT}`,
          `Training spend (ZAR): ${SHORT}`,
          `Skills development spend (ZAR): ${SHORT}`,
        ],
      },
      {
        title: "Project impact — procurement",
        intro: "Local and preferential procurement for LED and B-BBEE packs.",
        itemStyle: "field",
        items: [
          `Local procurement (ZAR): ${SHORT}`,
          `Preferential procurement (ZAR): ${SHORT}`,
          `Local suppliers engaged: ${SHORT}`,
          `SME / ESD spend (ZAR): ${SHORT}`,
        ],
      },
      {
        title: "Socio-economic impact",
        itemStyle: "field",
        items: [
          `Households benefiting: ${SHORT}`,
          `Local income injected (ZAR): ${SHORT}`,
        ],
      },
      {
        title: "Funder roll-up notes",
        intro:
          "Local → municipal → provincial (vs Stats SA) → national / international funder narrative.",
        itemStyle: "field",
        items: [
          "Audience notes (LED / ESG / M&E / funder): ______________",
          "________________________________________________________________",
        ],
      },
      {
        title: "People mentioned 1",
        itemStyle: "field",
        items: [
          `Initials and Surname: ${LINE}`,
          `Organisation / structure: ${LINE}`,
          `Contact details: ${LINE}`,
        ],
      },
      {
        title: "People mentioned 2",
        itemStyle: "field",
        items: [
          `Initials and Surname: ${LINE}`,
          `Organisation / structure: ${LINE}`,
          `Contact details: ${LINE}`,
        ],
      },
      {
        title: "Themes",
        itemStyle: "field",
        items: [
          `Theme: ${LINE}`,
          "Severity (critical / high / medium / low): ______________",
          `Location: ${LINE}`,
        ],
      },
    ],
  },
];

export function fieldTemplateById(id: string): FieldTemplate | undefined {
  return FIELD_TEMPLATES.find((t) => t.id === id);
}

export function fieldTemplateForSource(
  source: NarrativeCaptureSource,
): FieldTemplate | undefined {
  return FIELD_TEMPLATES.find((t) => t.captureSource === source);
}
