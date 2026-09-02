import { includedDashboardKeys } from "@/config/tierFlow";
import {
  buildModuleContributions,
  dashboardHrefFromLegacySlug,
  demoSeedAllowed,
  moduleFillScore,
  resolvePlanDashboardPackaging,
} from "@/lib/planPackaging";
import { PLAN_DASHBOARD_CATALOG } from "@/config/tierFlow";

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
  });

  it("allows demo seed only for trial+VIP showcase", () => {
    expect(demoSeedAllowed({ mode: "trial", vip: true })).toBe(true);
    expect(demoSeedAllowed({ mode: "trial", vip: false })).toBe(false);
    expect(demoSeedAllowed({ mode: "live", vip: true })).toBe(false);
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
});
