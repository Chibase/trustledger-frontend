import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { extractText, getDocumentProxy } from "unpdf";
import {
  FRAPPE_SID_COOKIE,
  TL_MODE_COOKIE,
  TL_USER_EMAIL_COOKIE,
} from "@/lib/auth.constants";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

function hasCaptureSession(jar: Awaited<ReturnType<typeof cookies>>): boolean {
  const mode = jar.get(TL_MODE_COOKIE)?.value?.trim();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value?.trim();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value?.trim();
  if (email) return true;
  if (mode === "trial") return true;
  return mode === "live" && Boolean(sid);
}

/** Extract text from an uploaded PDF for Capture minutes/attendance. */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimitAllow(`capture-pdf:${ip}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many uploads. Try again later." },
      { status: 429 },
    );
  }

  const jar = await cookies();
  if (!hasCaptureSession(jar)) {
    return NextResponse.json(
      { error: "Sign in to upload meeting notes." },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const isPdf =
    file.type === "application/pdf" ||
    name.endsWith(".pdf") ||
    file.type === "application/x-pdf";
  if (!isPdf) {
    return NextResponse.json(
      { error: "Only PDF files are accepted on this endpoint." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "PDF is too large (max 4 MB)." },
      { status: 400 },
    );
  }

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const cleaned = String(text || "")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleaned.length < 12) {
      return NextResponse.json(
        {
          error:
            "No readable text in this PDF (often a scanned photo). Type or paste the notes, or export a text-based PDF.",
          pages: totalPages,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text: cleaned.slice(0, 80_000),
      pages: totalPages,
      truncated: cleaned.length > 80_000,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message.slice(0, 200)
            : "Could not read PDF text",
      },
      { status: 502 },
    );
  }
}
