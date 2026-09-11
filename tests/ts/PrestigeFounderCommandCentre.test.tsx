/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { PrestigeFounderCommandCentre } from "@/components/ops/PrestigeFounderCommandCentre";
import type { ExecutiveBrief } from "@/lib/executiveIntel";
import type { Incident } from "@/types/incident";

jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({
      href,
      children,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
    }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

const mockBrief: ExecutiveBrief = {
  ok: true,
  generatedAt: "2026-09-11T12:00:00.000Z",
  healthOk: true,
  kpis: {
    pipelineSignals: 42,
    demoInterest: 18,
    assessments: 12,
    experienceScore: 4.8,
    weakFeedback: 0,
    contactEnquiries: 8,
  },
  weekly: [
    {
      key: "2026-09-01",
      label: "Sep 1",
      total: 15,
      byActivity: { demo: 6, assessment: 4, feedback: 2, contact: 3, quote: 0, support: 0, other: 0 },
    },
    {
      key: "2026-09-08",
      label: "Sep 8",
      total: 27,
      byActivity: { demo: 12, assessment: 8, feedback: 3, contact: 4, quote: 0, support: 0, other: 0 },
    },
  ],
  mix: [
    { kind: "demo", label: "Demo interest", value: 18 },
    { kind: "assessment", label: "Assessment / readiness", value: 12 },
    { kind: "contact", label: "Contact enquiry", value: 8 },
  ],
  funnel: [
    { key: "demo", label: "Demo interest", value: 18 },
    { key: "assessment", label: "Assessments", value: 12 },
    { key: "feedback", label: "Feedback", value: 4 },
    { key: "contact", label: "Contact", value: 8 },
  ],
  ratings: [
    { rating: 5, count: 8 },
    { rating: 4, count: 2 },
  ],
  readiness: [{ band: "Advanced", count: 7 }],
  talkingPoints: [
    "Platform health checks are green for public product surfaces.",
    "Strong acquisition conversion from readiness assessment to direct contact.",
  ],
  sampleNote: null,
  voice: {
    origins: [{ label: "Direct", value: 20 }],
    industries: [{ label: "Mining & Resources", value: 14 }],
    influence: [{ label: "Executive / C-Suite", value: 12 }],
    sentiments: [{ label: "Auditable trust", value: 10 }],
    perceptionSummary: "Visitors report high confidence in governance auditability.",
    quotes: [
      {
        leadName: "LEAD-1",
        person: "Sipho Dlamini",
        organization: "Kumba Iron Ore",
        industry: "Mining",
        quote: "Clear auditability from ward to board.",
        activityLabel: "Demo",
        origin: "Direct",
        rating: 5,
      },
    ],
  },
};

const mockPayments = {
  ok: true,
  total: 2,
  recent: [
    {
      name: "PAY-001",
      person: "Nomcebo Zondi",
      email: "nomcebo@example.com",
      organization: "Zondi Mining Ltd",
      planLabel: "Project",
      amountLabel: "R 24,000",
      reference: "ref_zondi_01",
      status: "Paid",
      modified: "2026-09-10T14:00:00Z",
    },
  ],
};

const mockIncidents: Incident[] = [
  {
    id: "INC-001",
    title: "Community access road blockage",
    status: "Investigating",
    priority: "P1-Critical",
    slaBreached: false,
    projectId: "PRJ-001",
    ward: "Ward 4",
    createdAt: "2026-09-09T08:00:00Z",
    description: "Access road temporarily obstructed.",
    actionItems: [],
  },
];

describe("PrestigeFounderCommandCentre", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders founder greeting with authenticated identity", () => {
    render(
      <PrestigeFounderCommandCentre
        user={{
          name: "Thozamile Ngcozela",
          email: "thozi@chibaseconsulting.co.za",
          role: "admin",
          mode: "live",
          trialPlan: "institutional",
          isVip: true,
        }}
        brief={mockBrief}
        payments={mockPayments}
        seedIncidents={mockIncidents}
      />,
    );

    expect(screen.getByText(/Good (morning|afternoon|evening), Thozamile/i)).toBeInTheDocument();
    expect(screen.getByText(/Thozamile Ngcozela \(thozi@chibaseconsulting\.co\.za\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Executive Command Centre/i)).toBeInTheDocument();
  });

  it("renders the Executive KPI Bento Strip with real metrics", () => {
    render(
      <PrestigeFounderCommandCentre
        user={{
          name: "Thozamile Ngcozela",
          email: "thozi@chibaseconsulting.co.za",
          role: "admin",
          mode: "live",
          trialPlan: "institutional",
          isVip: true,
        }}
        brief={mockBrief}
        payments={mockPayments}
        seedIncidents={mockIncidents}
      />,
    );

    // Platform condition
    expect(screen.getByText(/Platform Condition/i)).toBeInTheDocument();
    expect(screen.getByText(/1 P1 Critical case open/i)).toBeInTheDocument();

    // Inbound signals
    expect(screen.getAllByText("42").length).toBeGreaterThan(0);
    expect(screen.getByText(/8 contact enquiries/i)).toBeInTheDocument();
  });

  it("renders the core analytical sections with CHARTS → SUMMARY → DETAILS → ACTION hierarchy", () => {
    render(
      <PrestigeFounderCommandCentre
        user={{
          name: "Thozamile Ngcozela",
          email: "thozi@chibaseconsulting.co.za",
          role: "admin",
          mode: "live",
          trialPlan: "institutional",
        }}
        brief={mockBrief}
        payments={mockPayments}
        seedIncidents={mockIncidents}
      />,
    );

    // Section A: Commercial Activity Trend
    expect(screen.getByText(/Weekly Platform Activity Velocity/i)).toBeInTheDocument();
    expect(screen.getByText(/42 total activity signals across the last eight weeks/i)).toBeInTheDocument();
    expect(screen.getByText(/Investigate weekly breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Inspect client activity ledger →/i)).toBeInTheDocument();

    // Section B: Clients by Plan Tier
    expect(screen.getByText(/Clients by Plan Tier/i)).toBeInTheDocument();

    // Section C: Platform Build Progress
    expect(screen.getByText(/Module Completion Velocity/i)).toBeInTheDocument();

    // Section D: Acquisition & Marketing Funnel
    expect(screen.getByText(/Acquisition & Discovery Funnel/i)).toBeInTheDocument();
    expect(screen.getByText(/Review marketing desk →/i)).toBeInTheDocument();
  });

  it("surfaces P1 critical cases in Requires Founder Attention", () => {
    render(
      <PrestigeFounderCommandCentre
        user={{
          name: "Thozamile Ngcozela",
          email: "thozi@chibaseconsulting.co.za",
          role: "admin",
          mode: "live",
        }}
        brief={mockBrief}
        payments={mockPayments}
        seedIncidents={mockIncidents}
      />,
    );

    expect(screen.getByText(/Requires Founder Attention/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Critical P1 Incident: Community access road blockage/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Resolve case →/i)).toBeInTheDocument();
  });

  it("renders live activity stream and quick actions", () => {
    render(
      <PrestigeFounderCommandCentre
        user={{
          name: "Thozamile Ngcozela",
          email: "thozi@chibaseconsulting.co.za",
          role: "admin",
          mode: "live",
        }}
        brief={mockBrief}
        payments={mockPayments}
        seedIncidents={mockIncidents}
      />,
    );

    expect(screen.getByText(/Recent Platform & Commercial Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Project — R 24,000/i)).toBeInTheDocument();
    expect(screen.getByText(/Executive Controls/i)).toBeInTheDocument();
    expect(screen.getByText(/Engagement Plan Desk/i)).toBeInTheDocument();
    expect(screen.getByText(/Financial & Payment Ledger/i)).toBeInTheDocument();
  });

  it("renders board talking points and stakeholder voice", () => {
    render(
      <PrestigeFounderCommandCentre
        user={{
          name: "Thozamile Ngcozela",
          email: "thozi@chibaseconsulting.co.za",
          role: "admin",
          mode: "live",
        }}
        brief={mockBrief}
        payments={mockPayments}
        seedIncidents={mockIncidents}
      />,
    );

    expect(screen.getByText(/Board & Investor Talking Points/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Platform health checks are green for public product surfaces\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/“Clear auditability from ward to board\.”/i)).toBeInTheDocument();
  });
});
