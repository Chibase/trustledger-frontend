import { contentSecurityPolicy } from "@/lib/security/headers";
import {
  TRUSTLEDGER_APEX_DOMAIN,
  TRUSTLEDGER_CLOUD_HOST,
  TRUSTLEDGER_INFO_EMAIL,
  TRUSTLEDGER_LEGACY_APEX_DOMAIN,
  TRUSTLEDGER_MARKETING_URL,
} from "@/lib/security/hosts";

describe("TrustLedger public domain (ADR-057)", () => {
  it("uses trustledgersrm.co.za as the current apex and Cloud host", () => {
    expect(TRUSTLEDGER_APEX_DOMAIN).toBe("trustledgersrm.co.za");
    expect(TRUSTLEDGER_CLOUD_HOST).toBe("app.trustledgersrm.co.za");
    expect(TRUSTLEDGER_MARKETING_URL).toBe("https://trustledgersrm.co.za");
    expect(TRUSTLEDGER_INFO_EMAIL).toBe("info@trustledgersrm.co.za");
  });

  it("keeps the retired apex only as a cutover fallback", () => {
    expect(TRUSTLEDGER_LEGACY_APEX_DOMAIN).toBe("trustledger.co.za");
    expect(`app.${TRUSTLEDGER_LEGACY_APEX_DOMAIN}`).toBe("app.trustledger.co.za");
    expect(TRUSTLEDGER_LEGACY_APEX_DOMAIN).not.toBe(TRUSTLEDGER_APEX_DOMAIN);
  });

  it("allows assessment embeds from both the new and retired marketing hosts", () => {
    const csp = contentSecurityPolicy();
    expect(csp).toContain("https://trustledgersrm.co.za");
    expect(csp).toContain("https://www.trustledgersrm.co.za");
    expect(csp).toContain("https://trustledger.co.za");
    expect(csp).toContain("https://www.trustledger.co.za");
  });
});
