import { VIP_SHOWCASE_PACK } from "@/data/vipShowcase";
import { looksLikeReportTemplateGuide } from "@/lib/reportComposer";
import { packageLabel } from "@/lib/planLabel";
import {
  allowedVipShowcaseEmails,
  DEFAULT_PREVIEW_PASSWORD,
  isAllowedVipShowcaseEmail,
  isVipShowcaseEnabled,
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
});

describe("VIP showcase auth gate", () => {
  const prev = {
    login: process.env.VIP_SHOWCASE_LOGIN,
    password: process.env.VIP_SHOWCASE_PASSWORD,
    vercel: process.env.VERCEL_ENV,
    emails: process.env.VIP_SHOWCASE_EMAILS,
    ops: process.env.PLATFORM_OPERATOR_EMAILS,
  };

  afterEach(() => {
    process.env.VIP_SHOWCASE_LOGIN = prev.login;
    process.env.VIP_SHOWCASE_PASSWORD = prev.password;
    process.env.VERCEL_ENV = prev.vercel;
    process.env.VIP_SHOWCASE_EMAILS = prev.emails;
    process.env.PLATFORM_OPERATOR_EMAILS = prev.ops;
  });

  it("is off on hosted Production without a password", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.VIP_SHOWCASE_LOGIN;
    delete process.env.VIP_SHOWCASE_PASSWORD;
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

  it("allowlists the operator email", () => {
    delete process.env.PLATFORM_OPERATOR_EMAILS;
    delete process.env.VIP_SHOWCASE_EMAILS;
    expect(isAllowedVipShowcaseEmail("admin@chibaseconsulting.co.za")).toBe(
      true,
    );
    expect(isAllowedVipShowcaseEmail("stranger@example.com")).toBe(false);
    expect(allowedVipShowcaseEmails()).toContain(
      "admin@chibaseconsulting.co.za",
    );
  });
});
