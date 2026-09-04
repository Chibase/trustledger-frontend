import { VIP_SHOWCASE_PACK } from "@/data/vipShowcase";
import {
  applyVipShowcaseSeed,
  purgeVipShowcaseSeed,
} from "@/lib/vipShowcaseSeed";
import { looksLikeReportTemplateGuide } from "@/lib/reportComposer";
import { isVipShowcaseWorkspace, packageLabel } from "@/lib/planLabel";
import { VIP_SHOWCASE_DEFAULT_EMAIL } from "@/lib/vipShowcaseIdentity";
import {
  allowedVipShowcaseEmails,
  DEFAULT_PREVIEW_PASSWORD,
  isAllowedVipShowcaseEmail,
  isVipShowcaseEnabled,
  isVipShowcaseLiveLoginMailbox,
  vipShowcaseClientIp,
  vipShowcasePasswordsMatch,
} from "@/lib/vipShowcaseAuth";

describe("VIP showcase pack", () => {
  it("ships a complete Institutional programme without retired sample ids", () => {
    const pack = VIP_SHOWCASE_PACK;
    expect(pack.project.id).toBe("PRJ-NCGR-B");
    expect(pack.stakeholders).toHaveLength(10);
    expect(pack.engagements.length).toBeGreaterThanOrEqual(4);
    expect(pack.commitments.length).toBeGreaterThanOrEqual(3);
    expect(pack.incidents).toHaveLength(3);
    expect(pack.evidence.length).toBeGreaterThanOrEqual(2);
    expect(pack.incidents.map((i) => i.status).sort()).toEqual(
      ["Closed", "Escalated", "Investigating"].sort(),
    );
    expect(pack.incidents.find((i) => i.id === "INC-NCGR-01")?.slaBreached).toBe(
      false,
    );
    expect(pack.incidents.find((i) => i.id === "INC-NCGR-03")?.slaBreached).toBe(
      true,
    );
    expect(pack.stakeholders.every((s) => s.source === "trial")).toBe(true);
    expect(pack.engagements.every((e) => e.source !== "seed")).toBe(true);
    const ids = [
      pack.project.id,
      ...pack.incidents.map((i) => i.id),
      ...pack.stakeholders.map((s) => s.id),
    ];
    expect(ids.some((id) => /^INC-100[0-9]$/.test(id) || id === "PRJ-001")).toBe(
      false,
    );
  });

  it("activity pack cites desk evidence and is not a month-end template", () => {
    const body = VIP_SHOWCASE_PACK.report.bodyMarkdown;
    expect(looksLikeReportTemplateGuide(body)).toBe(false);
    expect(body).toMatch(/INC-NCGR-02/);
    expect(body).toMatch(/INC-NCGR-01/);
  });

  it("labels Institutional as VIP", () => {
    expect(packageLabel("institutional", { vip: true })).toBe("VIP");
  });

  it("treats only the showcase mailbox as the illustrative showcase", () => {
    expect(
      isVipShowcaseWorkspace("trial", true, VIP_SHOWCASE_DEFAULT_EMAIL),
    ).toBe(true);
    expect(isVipShowcaseWorkspace("trial", true, "guest@example.com")).toBe(
      false,
    );
    expect(
      isVipShowcaseWorkspace("live", true, VIP_SHOWCASE_DEFAULT_EMAIL),
    ).toBe(false);
    expect(
      isVipShowcaseWorkspace("trial", false, VIP_SHOWCASE_DEFAULT_EMAIL),
    ).toBe(false);
    expect(isVipShowcaseWorkspace("trial", true)).toBe(false);
  });

  it("seeds the showcase when the email argument is empty but the session cookie is set", () => {
    window.localStorage.clear();
    document.cookie = `tl-user-email=${encodeURIComponent(VIP_SHOWCASE_DEFAULT_EMAIL)}`;
    document.cookie = "tl-mode=trial";
    document.cookie = "tl-vip=1";
    const result = applyVipShowcaseSeed({
      orgId: "org-thozi",
      email: "",
    });
    expect(result.skipped).toBeUndefined();
    expect(result.projectId).toBe("PRJ-NCGR-B");
  });

  it("does not seed a Cloud VIP guest when the email argument is empty", () => {
    window.localStorage.clear();
    document.cookie = "tl-user-email=nomcebo%40example.com";
    document.cookie = "tl-mode=live";
    document.cookie = "tl-vip=1";
    const result = applyVipShowcaseSeed({
      orgId: "org-guest",
      email: "",
      forceShowcase: true,
    });
    expect(result.skipped).toBe(true);
    expect(result.projectId).toBe("");
  });

  it("does not preload demo desks unless this is the showcase workspace", () => {
    const result = applyVipShowcaseSeed({
      orgId: "org-test",
      email: "owner@example.com",
    });
    expect(result.skipped).toBe(true);
    expect(result.incidents).toBe(0);
  });

  it("seeds NCGR-B for the showcase mailbox even when forceShowcase is set", () => {
    window.localStorage.clear();
    const skipped = applyVipShowcaseSeed({
      orgId: "org-guest",
      email: "guest@example.com",
      forceShowcase: true,
    });
    expect(skipped.skipped).toBe(true);
    expect(skipped.projectId).toBe("");

    const seeded = applyVipShowcaseSeed({
      orgId: "org-thozi",
      email: VIP_SHOWCASE_DEFAULT_EMAIL,
      forceShowcase: true,
    });
    expect(seeded.skipped).toBeUndefined();
    expect(seeded.projectId).toBe("PRJ-NCGR-B");
    expect(seeded.incidents).toBe(3);
    const root = JSON.parse(
      window.localStorage.getItem("tl-org-data") || "{}",
    ) as Record<string, { projects?: Array<{ id: string }> }>;
    expect(
      root["org-thozi"]?.projects?.some((row) => row.id === "PRJ-NCGR-B"),
    ).toBe(true);
  });

  it("does not preload or wipe a Cloud VIP guest's own records", () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "tl-org-data",
      JSON.stringify({
        "org-guest": {
          orgId: "org-guest",
          projects: [{ id: "PRJ-OWN-1", name: "Guest site" }],
          incidents: [
            { id: "INC-OWN-1", title: "Own case", projectId: "PRJ-OWN-1" },
          ],
          evidence: [],
          stakeholders: [{ id: "STK-OWN-1", name: "Own contact" }],
          updatedAt: "2026-09-02T00:00:00.000Z",
        },
      }),
    );
    window.localStorage.setItem(
      "tl-crm-stakeholders",
      JSON.stringify([{ id: "STK-OWN-1", name: "Own contact" }]),
    );
    window.localStorage.setItem("tl-active-org-id", "org-guest");

    applyVipShowcaseSeed({
      orgId: "org-thozi",
      email: VIP_SHOWCASE_DEFAULT_EMAIL,
      forceShowcase: true,
    });
    const guest = applyVipShowcaseSeed({
      orgId: "org-guest",
      email: "nomcebo@example.com",
      forceShowcase: true,
    });
    expect(guest.skipped).toBe(true);
    expect(guest.projectId).toBe("");

    const root = JSON.parse(
      window.localStorage.getItem("tl-org-data") || "{}",
    ) as Record<
      string,
      {
        projects?: Array<{ id: string }>;
        incidents?: Array<{ id: string }>;
        stakeholders?: Array<{ id: string }>;
      }
    >;
    expect(root["org-guest"]?.projects?.some((row) => row.id === "PRJ-OWN-1")).toBe(
      true,
    );
    expect(
      root["org-guest"]?.incidents?.some((row) => row.id === "INC-OWN-1"),
    ).toBe(true);
    expect(
      root["org-guest"]?.stakeholders?.some((row) => row.id === "STK-OWN-1"),
    ).toBe(true);
    const projects = Object.values(root).flatMap((bucket) => bucket.projects || []);
    expect(projects.some((row) => row.id === "PRJ-NCGR-B")).toBe(false);

    const crm = JSON.parse(
      window.localStorage.getItem("tl-crm-stakeholders") || "[]",
    ) as Array<{ id: string }>;
    expect(crm.some((row) => row.id === "STK-OWN-1")).toBe(true);
    expect(crm.some((row) => row.id.startsWith("STK-NCGR-"))).toBe(false);
  });

  it("reverses leftover NCGR-B for a non-showcase VIP session", () => {
    window.localStorage.clear();
    applyVipShowcaseSeed({
      orgId: "org-thozi",
      email: VIP_SHOWCASE_DEFAULT_EMAIL,
      forceShowcase: true,
    });
    const guest = applyVipShowcaseSeed({
      orgId: "org-guest",
      email: "nomcebo@example.com",
    });
    expect(guest.skipped).toBe(true);
    expect(guest.purged).toBe(true);
    const root = JSON.parse(
      window.localStorage.getItem("tl-org-data") || "{}",
    ) as Record<string, { projects?: Array<{ id: string }> }>;
    const projects = Object.values(root).flatMap((bucket) => bucket.projects || []);
    expect(projects.some((row) => row.id === "PRJ-NCGR-B")).toBe(false);
    expect(window.localStorage.getItem("tl-vip-demo-bundle")).toBeNull();
  });

  it("does not purge the showcase mailbox while it is signed in", () => {
    window.localStorage.clear();
    applyVipShowcaseSeed({
      orgId: "org-thozi",
      email: VIP_SHOWCASE_DEFAULT_EMAIL,
      forceShowcase: true,
    });
    const result = purgeVipShowcaseSeed(VIP_SHOWCASE_DEFAULT_EMAIL);
    expect(result.purged).toBe(false);
    const root = JSON.parse(
      window.localStorage.getItem("tl-org-data") || "{}",
    ) as Record<string, { projects?: Array<{ id: string }> }>;
    expect(
      root["org-thozi"]?.projects?.some((row) => row.id === "PRJ-NCGR-B"),
    ).toBe(true);
  });

  it("keeps the signed-in org even if it still has the old showcase name", () => {
    window.localStorage.clear();
    const guestOrg = {
      id: "org-legacy-guest",
      name: "VIP Pilot — NCGR-B Showcase",
      planId: "institutional" as const,
      createdAt: "2026-09-01T00:00:00.000Z",
      ownerEmail: "guest@example.com",
      ownerName: "Guest",
      members: [],
      invites: [],
    };
    const stray = {
      ...guestOrg,
      id: "org-stray-test",
      ownerEmail: "qa@example.com",
      ownerName: "QA",
    };
    window.localStorage.setItem(
      "tl-orgs",
      JSON.stringify({
        "org-legacy-guest": guestOrg,
        "org-stray-test": stray,
      }),
    );
    window.localStorage.setItem("tl-active-org-id", "org-legacy-guest");
    applyVipShowcaseSeed({
      orgId: "org-legacy-guest",
      email: "guest@example.com",
    });
    const orgs = JSON.parse(window.localStorage.getItem("tl-orgs") || "{}") as Record<
      string,
      { id: string }
    >;
    expect(orgs["org-legacy-guest"]).toBeDefined();
    expect(orgs["org-stray-test"]).toBeUndefined();
    expect(window.localStorage.getItem("tl-active-org-id")).toBe(
      "org-legacy-guest",
    );
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("VIP showcase auth gate", () => {
  const prev = {
    login: process.env.VIP_SHOWCASE_LOGIN,
    password: process.env.VIP_SHOWCASE_PASSWORD,
    vercel: process.env.VERCEL_ENV,
    emails: process.env.VIP_SHOWCASE_EMAILS,
    email: process.env.VIP_SHOWCASE_EMAIL,
    ops: process.env.PLATFORM_OPERATOR_EMAILS,
  };

  afterEach(() => {
    restoreEnv("VIP_SHOWCASE_LOGIN", prev.login);
    restoreEnv("VIP_SHOWCASE_PASSWORD", prev.password);
    restoreEnv("VERCEL_ENV", prev.vercel);
    restoreEnv("VIP_SHOWCASE_EMAILS", prev.emails);
    restoreEnv("VIP_SHOWCASE_EMAIL", prev.email);
    restoreEnv("PLATFORM_OPERATOR_EMAILS", prev.ops);
  });

  it("is on in hosted Production with the documented password unless explicitly off", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.VIP_SHOWCASE_LOGIN;
    delete process.env.VIP_SHOWCASE_PASSWORD;
    expect(isVipShowcaseEnabled()).toBe(true);
    expect(
      vipShowcasePasswordsMatch(
        DEFAULT_PREVIEW_PASSWORD,
        DEFAULT_PREVIEW_PASSWORD,
      ),
    ).toBe(true);
  });

  it("turns off when VIP_SHOWCASE_LOGIN=0", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VIP_SHOWCASE_LOGIN = "0";
    expect(isVipShowcaseEnabled()).toBe(false);
  });

  it("is on in preview and accepts the default preview password", () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.VIP_SHOWCASE_LOGIN;
    delete process.env.VIP_SHOWCASE_PASSWORD;
    expect(isVipShowcaseEnabled()).toBe(true);
    expect(
      vipShowcasePasswordsMatch(
        DEFAULT_PREVIEW_PASSWORD,
        DEFAULT_PREVIEW_PASSWORD,
      ),
    ).toBe(true);
    expect(
      vipShowcasePasswordsMatch("wrong-password", DEFAULT_PREVIEW_PASSWORD),
    ).toBe(false);
  });

  it("allowlists the showcase mailbox, not the Platform Operator or thozi@ other-plan mailbox", () => {
    delete process.env.PLATFORM_OPERATOR_EMAILS;
    delete process.env.VIP_SHOWCASE_EMAILS;
    delete process.env.VIP_SHOWCASE_EMAIL;
    process.env.PLATFORM_OPERATOR_EMAILS = "admin@chibaseconsulting.co.za";
    expect(VIP_SHOWCASE_DEFAULT_EMAIL).toBe("sirthoz@trustledgersrm.co.za");
    expect(isAllowedVipShowcaseEmail(VIP_SHOWCASE_DEFAULT_EMAIL)).toBe(true);
    expect(isAllowedVipShowcaseEmail("thozi@chibaseconsulting.co.za")).toBe(
      false,
    );
    expect(isAllowedVipShowcaseEmail("admin@chibaseconsulting.co.za")).toBe(
      false,
    );
    expect(isAllowedVipShowcaseEmail("stranger@example.com")).toBe(false);
    expect(allowedVipShowcaseEmails()).toContain(VIP_SHOWCASE_DEFAULT_EMAIL);
  });

  it("sends the showcase mailbox away from live Cloud login", () => {
    delete process.env.VIP_SHOWCASE_LOGIN;
    expect(isVipShowcaseLiveLoginMailbox(VIP_SHOWCASE_DEFAULT_EMAIL)).toBe(
      true,
    );
    expect(isVipShowcaseLiveLoginMailbox("thozi@chibaseconsulting.co.za")).toBe(
      false,
    );
    expect(isVipShowcaseLiveLoginMailbox("admin@chibaseconsulting.co.za")).toBe(
      false,
    );
    process.env.VIP_SHOWCASE_LOGIN = "0";
    expect(isVipShowcaseLiveLoginMailbox(VIP_SHOWCASE_DEFAULT_EMAIL)).toBe(
      false,
    );
  });

  it("honours VIP_SHOWCASE_EMAIL extra address without leaking into later tests", () => {
    process.env.VIP_SHOWCASE_EMAIL = "guest@example.com";
    delete process.env.VIP_SHOWCASE_EMAILS;
    expect(isAllowedVipShowcaseEmail("guest@example.com")).toBe(true);
  });
});

function requestWithHeaders(headers: Record<string, string>): Request {
  const lookup = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    headers: {
      get(name: string) {
        return lookup.get(name.toLowerCase()) ?? null;
      },
    },
  } as Request;
}

describe("VIP showcase client IP", () => {
  it("prefers x-vercel-forwarded-for first hop over spoofable x-forwarded-for", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "1.1.1.1, 10.0.0.1",
      "x-vercel-forwarded-for": "203.0.113.9, 10.0.0.1",
    });
    expect(vipShowcaseClientIp(request)).toBe("203.0.113.9");
  });

  it("uses the last x-forwarded-for hop when Vercel header is absent", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "1.1.1.1, 10.0.0.1",
    });
    expect(vipShowcaseClientIp(request)).toBe("10.0.0.1");
  });
});
