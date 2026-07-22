import { NextResponse } from "next/server";
import { isWorkEmail } from "@/data/assessment";
import {
  signTrialActivationToken,
  verifyTrialActivationToken,
  verifyTrialPassword,
  hashTrialPassword,
} from "@/lib/trialProvision";

type LoginBody = {
  email?: string;
  password?: string;
  token?: string;
};

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const token = (body.token || "").trim();

  if (!email || !isWorkEmail(email) || !password || !token) {
    return NextResponse.json(
      { error: "Email, password, and activation token are required." },
      { status: 400 },
    );
  }

  const payload = verifyTrialActivationToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Activation link expired or invalid. Use the email link or subscribe again." },
      { status: 401 },
    );
  }
  if (payload.email !== email) {
    return NextResponse.json(
      { error: "Email does not match this trial activation." },
      { status: 401 },
    );
  }
  if (!verifyTrialPassword(password, payload.passHash)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    email: payload.email,
    name: payload.name,
    planId: payload.planId,
    organization: payload.organization || null,
    startedAt: payload.startedAt,
    billAt: payload.billAt,
    reference: payload.reference,
    token,
  });
}

type ChangeBody = {
  token?: string;
  currentPassword?: string;
  newPassword?: string;
};

export async function PUT(request: Request) {
  let body: ChangeBody;
  try {
    body = (await request.json()) as ChangeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = (body.token || "").trim();
  const currentPassword = body.currentPassword || "";
  const newPassword = (body.newPassword || "").trim();

  if (!token || !currentPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Token, current password, and a new password (8+ chars) are required." },
      { status: 400 },
    );
  }

  const payload = verifyTrialActivationToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Activation expired or invalid." },
      { status: 401 },
    );
  }
  if (!verifyTrialPassword(currentPassword, payload.passHash)) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 },
    );
  }

  const nextToken = signTrialActivationToken({
    ...payload,
    passHash: hashTrialPassword(newPassword),
  });

  return NextResponse.json({ ok: true, token: nextToken });
}
