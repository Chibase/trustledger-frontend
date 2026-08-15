import type { CaptureSource } from "@/lib/captureStore";
import type { ResourcePack } from "@/data/resources";

export type FieldTemplate = ResourcePack & {
  family: "field-template";
  captureSource: CaptureSource;
  pasteSkeleton: string;
  mapsTo: string[];
};

const ATTENDEE_SLOT = `Name: 
Organisation: 
Kind: (individual / community_group / traditional_authority / government / contractor / ngo / other)
Role: 
Contact: 
Influence: (high / medium / low)

`;

function attendeeSlots(count: number): string {
  return Array.from({ length: count }, () => ATTENDEE_SLOT).join("");
}

const ATTENDEE_FIELDS = [
  "Name: ______________________________________",
  "Organisation: ______________________________________",
  "Kind (individual / community_group / traditional_authority / government / contractor / ngo / other): ______________",
  "Role: ______________________________________",
  "Contact: ______________________________________",
  "Influence (high / medium / low): ______________",
];

function attendeeFieldSections(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Attendee ${i + 1}`,
    itemStyle: "field" as const,
    items: ATTENDEE_FIELDS,
  }));
}

export const FIELD_TEMPLATES: FieldTemplate[] = [
  {
    id: "minutes-template",
    family: "field-template",
    captureSource: "minutes",
    title: "Meeting Minutes",
    shortTitle: "Meeting minutes",
    tagline: "Fill in the room; map on first capture",
    description:
      "A blank minutes form with labeled fields for title, date, place, purpose, attendees, summary, actions, and new concerns — so a desk can map the record the first time you paste or upload it.",
    audience: "Facilitators, CLOs, site managers, project teams",
    pagesHint: "PDF form · fill in the field",
    version: "2026.08",
    filename: "Meeting-Minutes.pdf",
    mapsTo: [
      "Engagement (title, date, place, purpose, summary)",
      "Stakeholders (name, organisation, kind, role, contact)",
      "Commitments (promise, owner, due date)",
      "Grievance intake (new concerns)",
    ],
    pasteSkeleton: `MEETING MINUTES
Title: 
Date held (YYYY-MM-DD): 
Place / ward: 
Project / site: 
Purpose: (inform / consult / decide / remediate)
Kind: (meeting / consultation / walkabout / briefing)

SUMMARY


ATTENDEES
${attendeeSlots(4)}ACTIONS
Promise: 
Owner: 
Due date (YYYY-MM-DD): 

Promise: 
Owner: 
Due date (YYYY-MM-DD): 

CONCERNS
Theme: 
Severity: (critical / high / medium / low)
Location: 
Complainant: 
`,
    sections: [
      {
        title: "Meeting header",
        intro:
          "Use these labels in the same order when you type or paste. A desk maps labeled fields more reliably than free prose.",
        itemStyle: "field",
        items: [
          "Title: ______________________________________",
          "Date held (YYYY-MM-DD): ____________________",
          "Place / ward: ______________________________________",
          "Project / site: ______________________________________",
          "Purpose (inform / consult / decide / remediate): ______________",
          "Kind (meeting / consultation / walkabout / briefing): ______________",
        ],
      },
      {
        title: "Summary",
        intro: "What was said and decided, in plain language.",
        itemStyle: "field",
        items: [
          "________________________________________________________________",
          "________________________________________________________________",
          "________________________________________________________________",
        ],
      },
      ...attendeeFieldSections(4),
      {
        title: "Actions / promises",
        intro: "Each row can become a commitment: promise, owner, due date.",
        itemStyle: "field",
        items: [
          "Promise 1: ______________________________________",
          "Owner: ______________________________________",
          "Due date (YYYY-MM-DD): ____________________",
          "Promise 2: ______________________________________",
          "Owner: ______________________________________",
          "Due date (YYYY-MM-DD): ____________________",
        ],
      },
      {
        title: "New concerns",
        intro:
          "Log issues raised in the meeting so they can enter the grievance case convention.",
        itemStyle: "field",
        items: [
          "Theme: ______________________________________",
          "Severity (critical / high / medium / low): ______________",
          "Location: ______________________________________",
          "Complainant: ______________________________________",
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
    tagline: "One named person per row",
    description:
      "A blank attendance register with one labeled slot per person — name, organisation, kind, role, and contact — so names become registry candidates instead of an unreadable sign-in sheet.",
    audience: "Meeting chairs, facilitators, site clerks",
    pagesHint: "PDF form · one person per slot",
    version: "2026.08",
    filename: "Attendance-Register.pdf",
    mapsTo: [
      "Stakeholders (name, organisation, kind, role, contact)",
      "Engagement attendance list",
    ],
    pasteSkeleton: `ATTENDANCE REGISTER
Title: 
Date held (YYYY-MM-DD): 
Place / ward: 
Project / site: 

ATTENDEES
${attendeeSlots(8)}`,
    sections: [
      {
        title: "Session header",
        itemStyle: "field",
        items: [
          "Title: ______________________________________",
          "Date held (YYYY-MM-DD): ____________________",
          "Place / ward: ______________________________________",
          "Project / site: ______________________________________",
        ],
      },
      ...attendeeFieldSections(8),
    ],
  },
  {
    id: "field-note",
    family: "field-template",
    captureSource: "social_intel",
    title: "Field Note",
    shortTitle: "Field note",
    tagline: "Walkabout, rumour, and observation",
    description:
      "A short field-note form for walkabouts, social listening, and observations — people mentioned, themes, and severity — so informal intelligence still maps to named counterparts.",
    audience: "Liaison officers, facilitators, site teams",
    pagesHint: "PDF form · short note",
    version: "2026.08",
    filename: "Field-Note.pdf",
    mapsTo: [
      "Stakeholders (people mentioned)",
      "Engagement / social intelligence capture",
      "Grievance themes",
    ],
    pasteSkeleton: `FIELD NOTE
Date (YYYY-MM-DD): 
Place / ward: 
Project / site: 
Channel: (walkabout / social / rumour / observation)

SUMMARY


PEOPLE MENTIONED
${attendeeSlots(3)}THEMES
Theme: 
Severity: (critical / high / medium / low)
Location: 
`,
    sections: [
      {
        title: "Note header",
        itemStyle: "field",
        items: [
          "Date (YYYY-MM-DD): ____________________",
          "Place / ward: ______________________________________",
          "Project / site: ______________________________________",
          "Channel (walkabout / social / rumour / observation): ______________",
        ],
      },
      {
        title: "Summary",
        itemStyle: "field",
        items: [
          "________________________________________________________________",
          "________________________________________________________________",
        ],
      },
      ...attendeeFieldSections(3),
      {
        title: "Themes",
        itemStyle: "field",
        items: [
          "Theme: ______________________________________",
          "Severity (critical / high / medium / low): ______________",
          "Location: ______________________________________",
        ],
      },
    ],
  },
];

export function fieldTemplateById(id: string): FieldTemplate | undefined {
  return FIELD_TEMPLATES.find((t) => t.id === id);
}

export function fieldTemplateForSource(
  source: CaptureSource,
): FieldTemplate | undefined {
  return FIELD_TEMPLATES.find((t) => t.captureSource === source);
}
