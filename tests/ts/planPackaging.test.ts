import {
  includedDashboardKeys,
  isDashboardModuleEntitled,
  PLAN_DASHBOARD_CATALOG,
  TIER_FLOW,
} from "@/config/tierFlow";
import {
  buildModuleContributions,
  dashboardHrefFromLegacySlug,
  demoSeedAllowed,
  isPathEntitledForPlan,
  moduleFillScore,
  packagingPlanId,
  resolvePlanDashboardPackaging,
  suggestedNextModuleKey,
} from "@/lib/planPackaging";

describe("tier flow packaging", () => {
  it("always starts with executive and keeps SEP as a module", () => {
    const solo = includedDashboardKeys("solo");
    expect(solo[0]).toBe("executive");
    expect(solo).not.toContain("sep");
    expect(solo).not.toContain("engagements");

    const institutional = includedDashboardKeys("institutional");
    expect(institutional[0]).toBe("executive");
    expect(institutional).toContain("sep");
    expect(institutional).toContain("engagements");
    expect(institutional).toContain("esg");
    expect(institutional.indexOf("sep")).toBeGreaterThan(
      institutional.indexOf("engagements"),
    );
  });

  it("uses the same sequence for project and institutional SI modules", () => {
    expect(includedDashboardKeys("project")).toEqual(
      includedDashboardKeys("institutional"),
    );
  });

  it("resolves packaging without demo seed for non-VIP", () => {
    const view = resolvePlanDashboardPackaging({
      planId: "institutional",
      vip: false,
      mode: "trial",
    });
    expect(view.executiveDashboard.key).toBe("executive");
    expect(view.moduleDashboards.some((m) => m.key === "sep")).toBe(true);
    expect(view.demoSeedAllowed).toBe(false);
    expect(view.planId).toBe("institutional");
  });

  it("allows demo seed only for Thozamile's trial+VIP showcase", () => {
    expect(
      demoSeedAllowed({
        mode: "trial",
        vip: true,
        email: "thozi@chibaseconsulting.co.za",
      }),
    ).toBe(true);
    expect(
      demoSeedAllowed({
        mode: "trial",
        vip: true,
        email: "guest@example.com",
      }),
    ).toBe(false);
    expect(demoSeedAllowed({ mode: "trial", vip: false })).toBe(false);
    expect(
      demoSeedAllowed({
        mode: "live",
        vip: true,
        email: "thozi@chibaseconsulting.co.za",
      }),
    ).toBe(false);
  });

  it("maps legacy /plans/:id/sep links onto the SEP module route", () => {
    expect(dashboardHrefFromLegacySlug(["sep"])).toBe(
      PLAN_DASHBOARD_CATALOG.sep.href,
    );
    expect(dashboardHrefFromLegacySlug(["modules", "sep"])).toBe(
      PLAN_DASHBOARD_CATALOG.sep.href,
    );
    expect(dashboardHrefFromLegacySlug([])).toBe(
      PLAN_DASHBOARD_CATALOG.executive.href,
    );
  });

  it("computes equal-weight contributions and mean aggregate progress", () => {
    const packaging = resolvePlanDashboardPackaging({
      planId: "solo",
      vip: false,
      mode: "trial",
    });
    const { contributions, aggregateProgressPct } = buildModuleContributions({
      ...packaging,
      moduleDashboards: packaging.moduleDashboards.map((row) => row),
    });
    expect(moduleFillScore(0)).toBe(0);
    expect(moduleFillScore(1)).toBe(55);
    expect(contributions.length).toBe(packaging.moduleDashboards.length);
    expect(aggregateProgressPct).toBeGreaterThanOrEqual(0);
    expect(aggregateProgressPct).toBeLessThanOrEqual(100);
  });

  it("uses identical module sequence for VIP and non-VIP on the same tier", () => {
    const vip = resolvePlanDashboardPackaging({
      planId: "institutional",
      vip: true,
      mode: "trial",
      email: "thozi@chibaseconsulting.co.za",
    });
    const paid = resolvePlanDashboardPackaging({
      planId: "institutional",
      vip: false,
      mode: "trial",
    });
    expect(vip.moduleDashboards.map((row) => row.key)).toEqual(
      paid.moduleDashboards.map((row) => row.key),
    );
    expect(vip.executiveDashboard.key).toBe(paid.executiveDashboard.key);
    expect(vip.demoSeedAllowed).toBe(true);
    expect(paid.demoSeedAllowed).toBe(false);
    expect(
      resolvePlanDashboardPackaging({
        planId: "institutional",
        vip: true,
        mode: "trial",
        email: "guest@example.com",
      }).demoSeedAllowed,
    ).toBe(false);
  });

  it("keeps cross-tier sequence differences in TIER_FLOW config", () => {
    expect(TIER_FLOW.solo.modules).not.toEqual(TIER_FLOW.institutional.modules);
    expect(TIER_FLOW.solo.modules).toEqual(TIER_FLOW.practitioner.modules);
    expect(TIER_FLOW.project.modules).toEqual(TIER_FLOW.institutional.modules);
    expect(TIER_FLOW.institutional.gates?.some((g) => g.module === "sep")).toBe(
      true,
    );
  });

  it("blocks unauthorized module paths per tier", () => {
    expect(isDashboardModuleEntitled("sep", "solo")).toBe(false);
    expect(isDashboardModuleEntitled("esg", "practitioner")).toBe(false);
    expect(isDashboardModuleEntitled("sep", "institutional")).toBe(true);
    expect(isPathEntitledForPlan("/app/engagement-plan", "solo")).toBe(false);
    expect(isPathEntitledForPlan("/app/engagement-plan", "institutional")).toBe(
      true,
    );
    expect(isPathEntitledForPlan("/app/settings", "solo")).toBe(true);
  });

  it("forces Institutional sequence for trial VIP even if the cookie is Solo", () => {
    expect(
      packagingPlanId({ planId: "solo", vip: true, mode: "trial" }),
    ).toBe("institutional");
    expect(
      packagingPlanId({ planId: "solo", vip: false, mode: "trial" }),
    ).toBe("solo");
    expect(
      packagingPlanId({ planId: "project", vip: true, mode: "live" }),
    ).toBe("project");
  });

  it("suggests the first empty module honouring advisory gates", () => {
    const next = suggestedNextModuleKey(
      "institutional",
      [
        { key: "projects", empty: true },
        { key: "incidents", empty: true },
        { key: "sep", empty: true },
      ],
      ["projects", "incidents", "sep"],
    );
    expect(next).toBe("projects");
    const afterProjects = suggestedNextModuleKey(
      "institutional",
      [
        { key: "projects", empty: false },
        { key: "incidents", empty: true },
        { key: "sep", empty: true },
      ],
      ["projects", "incidents", "capture", "stakeholders", "engagements", "sep"],
    );
    expect(afterProjects).toBe("incidents");
  });
});
