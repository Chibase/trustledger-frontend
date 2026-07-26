"use client";

import { useEffect, useState } from "react";
import {
  addVipComment,
  exportVipCommentsJson,
  listVipComments,
} from "@/lib/vipComments";
import { getActiveOrgId } from "@/lib/orgStore";
import { useToast } from "@/components/ui/Toast";
import type { VipGuestComment } from "@/types/vipAccess";

type VipCommentsPanelProps = {
  orgId?: string | null;
  userName?: string;
  userEmail?: string | null;
  /** Plan Owners may export publishable comments for the website wall. */
  canExport?: boolean;
  isViewer?: boolean;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function VipCommentsPanel({
  orgId: orgIdProp,
  userName = "",
  userEmail = "",
  canExport = false,
  isViewer = false,
}: VipCommentsPanelProps) {
  const { pushToast } = useToast();
  const [orgId, setOrgId] = useState(orgIdProp || "");
  const [rows, setRows] = useState<VipGuestComment[]>([]);
  const [displayName, setDisplayName] = useState(userName);
  const [email, setEmail] = useState(userEmail || "");
  const [roleOnProject, setRoleOnProject] = useState("");
  const [rank, setRank] = useState("");
  const [entity, setEntity] = useState("");
  const [projectName, setProjectName] = useState("");
  const [body, setBody] = useState("");
  const [faceDataUrl, setFaceDataUrl] = useState<string | undefined>();
  const [publishConsent, setPublishConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    const id = orgIdProp || getActiveOrgId() || orgId;
    setOrgId(id || "");
    setRows(listVipComments(id || undefined));
  }

  useEffect(() => {
    const frame = requestAnimationFrame(refresh);
    window.addEventListener("tl-vip-comments-changed", refresh);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("tl-vip-comments-changed", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount sync
  }, [orgIdProp]);

  async function onFaceChange(file: File | null) {
    setError(null);
    if (!file) {
      setFaceDataUrl(undefined);
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setFaceDataUrl(url);
    } catch {
      setError("Could not read that image.");
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const id = orgId || getActiveOrgId();
    if (!id) {
      setError("No organisation workspace on this device yet.");
      return;
    }
    const result = addVipComment({
      orgId: id,
      projectName: projectName.trim() || undefined,
      profile: {
        displayName,
        email,
        roleOnProject,
        rank,
        entity,
        faceDataUrl,
      },
      body,
      publishConsent,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    pushToast("Comment saved", "success");
    refresh();
  }

  function handleExport() {
    const json = exportVipCommentsJson(orgId || getActiveOrgId());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trustledger-vip-comments.json";
    a.click();
    URL.revokeObjectURL(url);
    pushToast("Exported publishable comments JSON", "success");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-tl-ink">
          Guest comments
        </h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          {isViewer
            ? "Leave feedback with your project role, rank, entity, and optional photo. Desk editing, printing, and sharing stay locked."
            : "VIP invitees comment here. Export publish-consented rows for the website client-comment wall."}
        </p>
      </div>

      <form
          data-vip-comment="1"
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-tl-line pt-6"
        >
          <h2 className="font-display text-lg font-semibold">Add a comment</h2>
          {isViewer ? (
            <p className="text-xs text-tl-ink-muted">
              This is your allowed input on a VIP guest seat.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Your name</span>
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Role on this project</span>
              <input
                required
                value={roleOnProject}
                onChange={(e) => setRoleOnProject(e.target.value)}
                placeholder="e.g. Community liaison"
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Rank</span>
              <input
                required
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="e.g. Director / Ward councillor"
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Entity / organisation</span>
              <input
                required
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Project name</span>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              Face picture{" "}
              <span className="font-normal text-tl-ink-muted">(optional)</span>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onFaceChange(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            {faceDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faceDataUrl}
                alt=""
                className="mt-2 h-16 w-16 rounded-full object-cover"
              />
            ) : null}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Comment</span>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="What did you observe on this desk or project?"
            />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={publishConsent}
              onChange={(e) => setPublishConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              I consent to TrustLedger using this comment (name, role, entity,
              photo if provided) on the public client-comment section of the
              website.
            </span>
          </label>
          {error ? (
            <p className="text-sm text-tl-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Post comment
          </button>
        </form>

      {canExport ? (
        <div className="flex flex-wrap gap-2 border-t border-tl-line pt-4">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            Export publishable JSON
          </button>
        </div>
      ) : null}

      <section className="space-y-3 border-t border-tl-line pt-6">
        <h2 className="font-display text-lg font-semibold">Recent comments</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((c) => (
              <li key={c.id} className="border-b border-tl-line pb-4 last:border-0">
                <div className="flex gap-3">
                  {c.profile.faceDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.profile.faceDataUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tl-line text-sm font-medium text-tl-ink-muted"
                      aria-hidden
                    >
                      {c.profile.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-tl-ink">
                      {c.profile.displayName}
                      <span className="ml-2 text-xs font-normal text-tl-ink-muted">
                        {c.profile.rank} · {c.profile.entity}
                      </span>
                    </p>
                    <p className="text-xs text-tl-ink-muted">
                      {c.profile.roleOnProject}
                      {c.projectName ? ` · ${c.projectName}` : ""}
                      {c.publishConsent ? " · website consent" : ""}
                    </p>
                    <p className="mt-2 text-sm text-tl-ink">{c.body}</p>
                    <p className="mt-1 text-xs text-tl-ink-muted">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
