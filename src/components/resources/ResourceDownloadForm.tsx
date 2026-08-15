"use client";

import { useState } from "react";
import type { ResourcePack } from "@/data/resources";
import { HoneypotField, RecaptchaLegalNote, useRecaptcha } from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";

type Props = {
  pack: ResourcePack;
  onClose: () => void;
};

export function ResourceDownloadForm({ pack, onClose }: Props) {
  const { getToken } = useRecaptcha("resource_download");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(email)) {
      setError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    if (comment.trim().length < 10) {
      setError("Please share briefly how you will use this pack (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const captchaToken = await getToken();
      const res = await fetch("/api/resources/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: organization.trim() || undefined,
          comment: comment.trim(),
          tl_hp: honeypot,
          captchaToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        downloadUrl?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not unlock download. Try again.");
        return;
      }

      setDone(true);
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        window.location.assign(data.downloadUrl);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tl-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-download-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-tl-line bg-tl-surface p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
              Free download
            </p>
            <h2
              id="resource-download-title"
              className="mt-1 font-display text-xl font-semibold text-tl-ink"
            >
              {pack.shortTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-tl-line px-2 py-1 text-sm text-tl-ink-muted hover:bg-tl-paper"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {done ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-tl-ink">
              Your {pack.shortTitle.toLowerCase()} PDF is unlocking. If the
              download did not start, use the button below.
            </p>
            {downloadUrl ? (
              <a
                href={downloadUrl}
                className="inline-flex rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
              >
                Download again
              </a>
            ) : null}
            <p className="text-xs text-tl-ink-muted">
              We may follow up with TrustLedger guidance related to this
              resource. See our{" "}
              <a
                href="https://trustledger.co.za/privacy/"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="relative mt-5 space-y-3">
            <HoneypotField value={honeypot} onChange={setHoneypot} />
            <p className="text-sm text-tl-ink-muted">
              Enter a work email to unlock this PDF only —{" "}
              {pack.shortTitle.toLowerCase()}. We use this to send relevant
              guidance — not to share your details publicly.
            </p>
            <div>
              <label htmlFor="res-name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                id="res-name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="res-email" className="mb-1 block text-sm font-medium">
                Work email
              </label>
              <input
                id="res-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="res-org" className="mb-1 block text-sm font-medium">
                Organization{" "}
                <span className="font-normal text-tl-ink-muted">(optional)</span>
              </label>
              <input
                id="res-org"
                name="organization"
                autoComplete="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="res-comment" className="mb-1 block text-sm font-medium">
                How will you use this pack?
              </label>
              <textarea
                id="res-comment"
                name="comment"
                required
                minLength={10}
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Aligning site grievance SLAs ahead of a community forum"
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-tl-danger" role="alert">
                {error}
              </p>
            )}

            <RecaptchaLegalNote />

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
            >
              {submitting ? "Unlocking…" : "Download PDF"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
