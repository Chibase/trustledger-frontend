import {
  classifyActivity,
  activityLabel,
} from "@/lib/opsIntel";
import {
  CRM_SOURCE_BY_TAG,
  LEAD_FORM_INVENTORY,
  smokeRequiredForms,
} from "@/lib/leadFormInventory";
import {
  buildHs2SmokeLeadInput,
  buildLeadSmokeSnapshot,
  EM1_REMAINING_DESK_STEPS,
  HS2_SMOKE_EMAIL,
  HS2_SMOKE_JOB_TITLE,
  HS2_SMOKE_SOURCE_TAG,
} from "@/lib/leadSmoke";

describe("HS-2 lead form inventory", () => {
  it("lists the operator smoke-required public forms", () => {
    expect(smokeRequiredForms().map((row) => row.sourceTag)).toEqual([
      "contact",
      "product_feedback",
      "quote_request",
      "assessment",
      "support_ticket",
    ]);
  });

  it("keeps inventory source tags in lockstep with CRM_SOURCE_BY_TAG", () => {
    for (const row of LEAD_FORM_INVENTORY) {
      expect(CRM_SOURCE_BY_TAG[row.sourceTag]).toBe(row.crmSource);
    }
  });

  it("covers extra writer tags used by pay/trial/ops smoke", () => {
    expect(CRM_SOURCE_BY_TAG.hs2_smoke).toBe("Website Contact");
    expect(CRM_SOURCE_BY_TAG.paystack_payment).toBe("Paystack Payment");
    expect(CRM_SOURCE_BY_TAG.quote_request).toBe("Quote Request");
  });
});

describe("HS-2 ops smoke payload", () => {
  it("writes a work-email CRM Lead tagged HS-2 smoke", () => {
    const input = buildHs2SmokeLeadInput();
    expect(input.email).toBe(HS2_SMOKE_EMAIL);
    expect(input.jobTitle).toBe(HS2_SMOKE_JOB_TITLE);
    expect(input.sourceTag).toBe(HS2_SMOKE_SOURCE_TAG);
    expect(input.email.endsWith("@trustledgersrm.co.za")).toBe(true);
  });

  it("surfaces EM-1 Desk remaining steps without a Newsletter composer", () => {
    const snapshot = buildLeadSmokeSnapshot();
    expect(snapshot.em1.from).toBe("sales@trustledgersrm.co.za");
    expect(snapshot.em1.remaining).toEqual([...EM1_REMAINING_DESK_STEPS]);
    expect(snapshot.hs34.deferred).toBe(true);
    expect(snapshot.smokeRequired).toHaveLength(5);
  });
});

describe("ops activity classification", () => {
  it("classifies quote requests separately from contact", () => {
    expect(
      classifyActivity({
        name: "Q-1",
        job_title: "Quote request · Project · R12,000",
        source: "Quote Request",
      }),
    ).toBe("quote");
    expect(activityLabel("quote")).toBe("Quote request");
  });

  it("does not treat HS-2 smoke job title as a quote", () => {
    expect(
      classifyActivity({
        name: "SMOKE",
        job_title: "HS-2 smoke",
        source: "Website Contact",
      }),
    ).toBe("contact");
  });
});
