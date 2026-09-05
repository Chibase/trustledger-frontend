import { recaptchaRequired } from "@/lib/formGuard";
import { accessEmailVerificationEnabled } from "@/lib/accessVerification";
import { buildOperatorSitting } from "@/lib/operatorSitting";
import {
  fromAddressUsesCurrentApex,
  fromAddressUsesLegacyApex,
} from "@/lib/security/hosts";

const ENV_KEYS = [
  "FORM_REQUIRE_RECAPTCHA",
  "RECAPTCHA_SECRET_KEY",
  "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
  "ACCESS_EMAIL_VERIFICATION",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "VERCEL_ENV",
] as const;

function withEnv(
  patch: Record<string, string | undefined>,
  fn: () => void,
) {
  const prev: Record<string, string | undefined> = {};
  const keys = new Set([...ENV_KEYS, ...Object.keys(patch)]);
  for (const key of keys) {
    prev[key] = process.env[key];
    const next = patch[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
  try {
    fn();
  } finally {
    for (const key of keys) {
      const next = prev[key];
      if (next === undefined) delete process.env[key];
      else process.env[key] = next;
    }
  }
}

describe("reCAPTCHA fail-closed default", () => {
  it("stays open when keys are missing and FORM_REQUIRE_RECAPTCHA is unset", () => {
    withEnv(
      {
        FORM_REQUIRE_RECAPTCHA: undefined,
        RECAPTCHA_SECRET_KEY: undefined,
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: undefined,
      },
      () => {
        expect(recaptchaRequired()).toBe(false);
      },
    );
  });

  it("fails closed once keys exist even without FORM_REQUIRE_RECAPTCHA", () => {
    withEnv(
      {
        FORM_REQUIRE_RECAPTCHA: undefined,
        RECAPTCHA_SECRET_KEY: "secret",
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site",
      },
      () => {
        expect(recaptchaRequired()).toBe(true);
      },
    );
  });

  it("honours FORM_REQUIRE_RECAPTCHA=0 as an emergency bypass", () => {
    withEnv(
      {
        FORM_REQUIRE_RECAPTCHA: "0",
        RECAPTCHA_SECRET_KEY: "secret",
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site",
      },
      () => {
        expect(recaptchaRequired()).toBe(false);
      },
    );
  });

  it("fails closed when FORM_REQUIRE_RECAPTCHA=1 even if keys are missing", () => {
    withEnv(
      {
        FORM_REQUIRE_RECAPTCHA: "1",
        RECAPTCHA_SECRET_KEY: undefined,
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: undefined,
      },
      () => {
        expect(recaptchaRequired()).toBe(true);
      },
    );
  });
});

describe("ACCESS_EMAIL_VERIFICATION emergency bypass", () => {
  it("stays off when ACCESS_EMAIL_VERIFICATION=0 even if Resend is ready", () => {
    withEnv(
      {
        ACCESS_EMAIL_VERIFICATION: "0",
        VERCEL_ENV: "production",
        RESEND_API_KEY: `re_${"x".repeat(24)}`,
      },
      () => {
        expect(accessEmailVerificationEnabled()).toBe(false);
      },
    );
  });
});

describe("operator sitting snapshot", () => {
  it("flags a legacy From as sitting without claiming operator work is done", () => {
    withEnv(
      {
        FORM_REQUIRE_RECAPTCHA: "1",
        RECAPTCHA_SECRET_KEY: "secret",
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site",
        ACCESS_EMAIL_VERIFICATION: "1",
        RESEND_API_KEY: `re_${"x".repeat(24)}`,
        RESEND_FROM_EMAIL: "TrustLedger <noreply@trustledger.co.za>",
        VERCEL_ENV: "production",
      },
      () => {
        const snap = buildOperatorSitting({
          from: "TrustLedger <noreply@trustledger.co.za>",
        });
        const fromItem = snap.items.find((row) => row.id === "resend-from");
        expect(fromItem?.status).toBe("sitting");
        expect(snap.envClear).toBe(false);
        expect(snap.operatorClear).toBe(false);
        expect(snap.remainingOperator).toEqual([
          "Production form click-smoke",
          "Webway CTA paste",
          "Desk SMTP / Email Delivery Service",
        ]);
      },
    );
  });

  it("passes the env lane when keys, OTP, and current-apex From are on", () => {
    withEnv(
      {
        FORM_REQUIRE_RECAPTCHA: "1",
        RECAPTCHA_SECRET_KEY: "secret",
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site",
        ACCESS_EMAIL_VERIFICATION: "1",
        RESEND_API_KEY: `re_${"x".repeat(24)}`,
        RESEND_FROM_EMAIL: "TrustLedger <noreply@trustledgersrm.co.za>",
        VERCEL_ENV: "production",
      },
      () => {
        const snap = buildOperatorSitting({
          from: "TrustLedger <noreply@trustledgersrm.co.za>",
        });
        expect(snap.envClear).toBe(true);
        expect(snap.remainingEnv).toEqual([]);
        expect(snap.operatorClear).toBe(false);
        expect(snap.smokeForms.map((row) => row.id)).toContain("contact");
      },
    );
  });

  it("calls out ACCESS_EMAIL_VERIFICATION=0 despite Resend", () => {
    withEnv(
      {
        ACCESS_EMAIL_VERIFICATION: "0",
        RESEND_API_KEY: `re_${"x".repeat(24)}`,
        RESEND_FROM_EMAIL: "TrustLedger <noreply@trustledgersrm.co.za>",
        RECAPTCHA_SECRET_KEY: "secret",
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site",
        FORM_REQUIRE_RECAPTCHA: "1",
      },
      () => {
        const snap = buildOperatorSitting({
          from: "TrustLedger <noreply@trustledgersrm.co.za>",
        });
        const access = snap.items.find((row) => row.id === "access-verify");
        expect(access?.status).toBe("sitting");
        expect(access?.detail).toMatch(/despite Resend working/);
      },
    );
  });
});

describe("From apex helpers", () => {
  it("detects retired vs current apex on From addresses", () => {
    expect(
      fromAddressUsesLegacyApex("TrustLedger <noreply@trustledger.co.za>"),
    ).toBe(true);
    expect(
      fromAddressUsesCurrentApex("TrustLedger <noreply@trustledgersrm.co.za>"),
    ).toBe(true);
    expect(
      fromAddressUsesLegacyApex("TrustLedger <noreply@trustledgersrm.co.za>"),
    ).toBe(false);
  });
});
