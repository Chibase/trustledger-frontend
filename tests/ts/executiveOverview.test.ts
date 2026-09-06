import {
  countActiveProjects,
  countHeldEngagements,
  countOpenCases,
  engagementTrendSeries,
  formatRelativeDeskTime,
  grievanceStatusSlices,
  lastMonthBuckets,
  projectHealthMix,
  projectPlaceLabels,
  recentOverviewActivity,
  upcomingEngagements,
  userInitials,
  welcomeFirstName,
} from "@/lib/executiveOverview";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import { projectMatchesDeskSearch } from "@/lib/workspaceSearch";
import type { Engagement } from "@/types/engagement";
import type { Project } from "@/types/project";

const now = new Date("2026-09-06T12:00:00+02:00");

function engagement(partial: Partial<Engagement>): Engagement {
  return {
    id: "ENG-T",
    title: "Briefing",
    kind: "briefing",
    status: "held",
    ward: "Ward 12",
    projectId: "PRJ-001",
    heldOn: "2026-09-01",
    summary: "On file",
    attendeesLabel: "Desk",
    actionItems: [],
    stakeholderIds: ["STK-1"],
    source: "seed",
    createdAt: "2026-09-01T10:00:00+02:00",
    ...partial,
  };
}

describe("executiveOverview", () => {
  it("takes the first name and initials from the signed-in user", () => {
    expect(welcomeFirstName("Ada Mokoena")).toBe("Ada");
    expect(welcomeFirstName("  ")).toBeNull();
    expect(userInitials("Ada Mokoena")).toBe("AM");
    expect(userInitials("Ada")).toBe("AD");
  });

  it("counts active delivery projects, not completed", () => {
    expect(countActiveProjects(mockProjects)).toBe(2);
    expect(
      countActiveProjects([
        { ...mockProjects[0]!, status: "Active" },
        { ...mockProjects[0]!, id: "PRJ-DONE", status: "Completed" },
      ]),
    ).toBe(1);
  });

  it("counts open cases and held engagements from records", () => {
    expect(countOpenCases(mockIncidents)).toBeGreaterThan(0);
    expect(countOpenCases(mockIncidents.filter((r) => r.status === "Closed"))).toBe(0);
    expect(
      countHeldEngagements([
        engagement({ status: "held" }),
        engagement({ id: "ENG-2", status: "draft" }),
        engagement({ id: "ENG-3", status: "closed" }),
      ]),
    ).toBe(2);
  });

  it("groups grievances without inventing a mix", () => {
    const slices = grievanceStatusSlices([
      { ...mockIncidents[0]!, status: "Open" },
      { ...mockIncidents[0]!, id: "INC-B", status: "Investigating" },
      { ...mockIncidents[0]!, id: "INC-C", status: "Closed" },
    ]);
    expect(slices.map((s) => s.label).sort()).toEqual(
      ["In progress", "Open", "Resolved"].sort(),
    );
    expect(slices.every((s) => s.value === 1)).toBe(true);
  });

  it("marks OnHold as at risk and past target end as delayed", () => {
    const delayed: Project = {
      ...mockProjects[0]!,
      id: "PRJ-LATE",
      status: "Active",
      targetEndDate: "2026-01-01",
    };
    const mix = projectHealthMix(
      [
        { ...mockProjects[0]!, status: "Active", targetEndDate: "2026-12-01" },
        { ...mockProjects[3]!, status: "OnHold" },
        delayed,
        { ...mockProjects[2]!, status: "Completed" },
      ],
      now.getTime(),
    );
    expect(mix).toEqual({ onTrack: 1, atRisk: 1, delayed: 1, total: 3 });
  });

  it("builds a six-month trend from dated records", () => {
    const buckets = lastMonthBuckets(6, now);
    const points = engagementTrendSeries(
      [
        engagement({
          heldOn: "2026-09-02",
          stakeholderIds: ["A", "B"],
        }),
      ],
      [{ ...mockIncidents[0]!, reportedAt: "2026-09-03T09:00:00+02:00" }],
      buckets,
    );
    expect(points).toHaveLength(6);
    const sep = points[points.length - 1]!;
    expect(sep.label).toMatch(/^Sep/);
    expect(sep.engagements).toBe(1);
    expect(sep.stakeholdersReached).toBe(2);
    expect(sep.grievances).toBe(1);
    expect(points.slice(0, 5).every((p) => p.engagements === 0)).toBe(true);
  });

  it("lists places on file and upcoming held-on dates", () => {
    expect(projectPlaceLabels(mockProjects)).toContain("Ward 12");
    const upcoming = upcomingEngagements(
      [
        engagement({
          id: "ENG-FUTURE",
          title: "Next briefing",
          status: "draft",
          heldOn: "2026-09-20",
          placeLabel: "Clinic road",
        }),
        engagement({
          id: "ENG-PAST",
          status: "closed",
          heldOn: "2026-01-01",
        }),
      ],
      now.getTime(),
    );
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.title).toBe("Next briefing");
    expect(upcoming[0]?.place).toBe("Clinic road");
  });

  it("sorts recent activity by time on file", () => {
    const rows = recentOverviewActivity({
      incidents: [mockIncidents[0]!],
      engagements: [engagement({ createdAt: "2026-09-05T10:00:00+02:00" })],
      limit: 4,
    });
    expect(rows[0]?.kind).toBe("engagement");
    expect(formatRelativeDeskTime("2026-09-06T11:50:00+02:00", now.getTime())).toBe(
      "10 min ago",
    );
  });

  it("matches project desk search on name, ward, or id", () => {
    expect(projectMatchesDeskSearch(mockProjects[0]!, "ward 12")).toBe(true);
    expect(projectMatchesDeskSearch(mockProjects[0]!, "PRJ-001")).toBe(true);
    expect(projectMatchesDeskSearch(mockProjects[0]!, "no-such")).toBe(false);
    expect(projectMatchesDeskSearch(mockProjects[0]!, "  ")).toBe(true);
  });
});
