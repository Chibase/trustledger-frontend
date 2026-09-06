import {
  PASSWORD_RESET_GENERIC_MESSAGE,
  completeLivePasswordReset,
  requestLivePasswordReset,
} from "@/lib/passwordReset";
import {
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/passwordResetToken";
import { findCloudLoginUser, setCloudUserPassword } from "@/lib/cloudUserPassword";
import { sendPasswordResetEmail, transactionalEmailConfigured } from "@/lib/transactionalEmail";
import { isVipShowcaseLiveLoginMailbox } from "@/lib/vipShowcaseAuth";

jest.mock("@/lib/cloudUserPassword", () => ({
  findCloudLoginUser: jest.fn(),
  setCloudUserPassword: jest.fn(),
}));

jest.mock("@/lib/transactionalEmail", () => ({
  sendPasswordResetEmail: jest.fn(),
  transactionalEmailConfigured: jest.fn(() => true),
}));

jest.mock("@/lib/leadCapture", () => ({
  frappeKeyPair: jest.fn(() => ({ key: "k", secret: "s" })),
  frappeBase: jest.fn(() => "https://cloud.example.test"),
}));

jest.mock("@/lib/vipShowcaseAuth", () => ({
  isVipShowcaseLiveLoginMailbox: jest.fn(() => false),
}));

const findUser = findCloudLoginUser as jest.MockedFunction<typeof findCloudLoginUser>;
const setPassword = setCloudUserPassword as jest.MockedFunction<
  typeof setCloudUserPassword
>;
const sendMail = sendPasswordResetEmail as jest.MockedFunction<
  typeof sendPasswordResetEmail
>;
const mailConfigured = transactionalEmailConfigured as jest.MockedFunction<
  typeof transactionalEmailConfigured
>;
const isVipMailbox = isVipShowcaseLiveLoginMailbox as jest.MockedFunction<
  typeof isVipShowcaseLiveLoginMailbox
>;

describe("passwordResetToken", () => {
  it("signs a token for the registered email and rejects expiry / wrong kind", () => {
    const token = signPasswordResetToken("Owner@Example.com", 1_000_000, "USR-Owner");
    const parsed = verifyPasswordResetToken(token, 1_000_000);
    expect(parsed?.email).toBe("owner@example.com");
    expect(parsed?.user).toBe("USR-Owner");
    expect(verifyPasswordResetToken(token, 1_000_000 + 60 * 60 + 1)).toBeNull();
    expect(verifyPasswordResetToken("not-a-token")).toBeNull();
  });
});

describe("requestLivePasswordReset", () => {
  beforeEach(() => {
    findUser.mockReset();
    sendMail.mockReset();
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ sent: true });
    isVipMailbox.mockReturnValue(false);
  });

  it("does not email the VIP showcase mailbox", async () => {
    isVipMailbox.mockReturnValue(true);
    const result = await requestLivePasswordReset("vip@example.com");
    expect(result.status).toBe(200);
    expect(findUser).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects a missing email", async () => {
    const result = await requestLivePasswordReset("not-an-email");
    expect(result.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("does not email unknown or disabled Cloud users, but stays generic", async () => {
    findUser.mockResolvedValueOnce(null);
    const missing = await requestLivePasswordReset("nobody@example.com");
    expect(missing).toEqual({
      status: 200,
      body: { ok: true, message: PASSWORD_RESET_GENERIC_MESSAGE },
    });
    expect(sendMail).not.toHaveBeenCalled();

    findUser.mockResolvedValueOnce({
      name: "paused@example.com",
      email: "paused@example.com",
      firstName: "Paused",
      enabled: false,
    });
    const disabled = await requestLivePasswordReset("paused@example.com");
    expect(disabled.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("emails a TrustLedger reset link to the registered Cloud inbox", async () => {
    findUser.mockResolvedValue({
      name: "USR-Ada",
      email: "owner@example.com",
      firstName: "Ada",
      enabled: true,
    });
    const result = await requestLivePasswordReset("Owner@example.com");
    expect(result.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const sent = sendMail.mock.calls[0]![0];
    expect(sent.to).toBe("owner@example.com");
    const token = new URL(sent.resetUrl).searchParams.get("token") || "";
    expect(verifyPasswordResetToken(token)?.user).toBe("USR-Ada");
  });

  it("surfaces a send failure instead of claiming the mail went out", async () => {
    findUser.mockResolvedValue({
      name: "owner@example.com",
      email: "owner@example.com",
      firstName: "Ada",
      enabled: true,
    });
    sendMail.mockResolvedValue({ sent: false, detail: "Resend down" });
    const result = await requestLivePasswordReset("owner@example.com");
    expect(result.status).toBe(502);
    expect(result.body.error).toMatch(/could not send/i);
  });
});

describe("completeLivePasswordReset", () => {
  beforeEach(() => {
    setPassword.mockReset();
    isVipMailbox.mockReturnValue(false);
  });

  it("sets the Cloud password when the email link is valid", async () => {
    setPassword.mockResolvedValue({
      ok: true,
      email: "owner@example.com",
      temporaryPassword: "new-secret-1",
    });
    const token = signPasswordResetToken("owner@example.com", undefined, "USR-Ada");
    const result = await completeLivePasswordReset({
      token,
      newPassword: "new-secret-1",
    });
    expect(result.status).toBe(200);
    expect(setPassword).toHaveBeenCalledWith({
      email: "USR-Ada",
      newPassword: "new-secret-1",
    });
  });

  it("rejects a short password and an expired token", async () => {
    const short = await completeLivePasswordReset({
      token: "x",
      newPassword: "short",
    });
    expect(short.status).toBe(400);
    expect(setPassword).not.toHaveBeenCalled();

    const token = signPasswordResetToken("owner@example.com", 10);
    const expired = await completeLivePasswordReset({
      token,
      newPassword: "long-enough",
    });
    expect(expired.status).toBe(400);
    expect(expired.body.error).toMatch(/expired/i);
  });

  it("does not change a VIP showcase Cloud password from a reset token", async () => {
    isVipMailbox.mockReturnValue(true);
    const token = signPasswordResetToken("vip@example.com");
    const result = await completeLivePasswordReset({
      token,
      newPassword: "long-enough",
    });
    expect(result.status).toBe(400);
    expect(setPassword).not.toHaveBeenCalled();
  });
});
