import { VIP_SHOWCASE_PACK } from "@/data/vipShowcase";
import { looksLikeReportTemplateGuide } from "@/lib/reportComposer";
import { isVipShowcaseWorkspace, packageLabel } from "@/lib/planLabel";
import {
  allowedVipShowcaseEmails,
  DEFAULT_PREVIEW_PASSWORD,
  isAllowedVipShowcaseEmail,
  isVipShowcaseEnabled,
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

  it("treats only trial+VIP as the illustrative showcase workspace", () => {
    expect(isVipShowcaseWorkspace("trial", true)).toBe(true);
    expect(isVipShowcaseWorkspace("live", true)).toBe(false);
    expect(isVipShowcaseWorkspace("trial", false)).toBe(false);
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

  it("allowlists the showcase mailbox, not the Platform Operator master plan", () => {
    delete process.env.PLATFORM_OPERATOR_EMAILS;
    delete process.env.VIP_SHOWCASE_EMAILS;
    delete process.env.VIP_SHOWCASE_EMAIL;
    process.env.PLATFORM_OPERATOR_EMAILS = "admin@chibaseconsulting.co.za";
    expect(isAllowedVipShowcaseEmail("thozi@chibaseconsulting.co.za")).toBe(
      true,
    );
    expect(isAllowedVipShowcaseEmail("admin@chibaseconsulting.co.za")).toBe(
      false,
    );
    expect(isAllowedVipShowcaseEmail("stranger@example.com")).toBe(false);
    expect(allowedVipShowcaseEmails()).toContain(
      "thozi@chibaseconsulting.co.za",
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
