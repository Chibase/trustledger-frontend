import { formatDraftSavedAt } from "@/lib/connectivity";

type CaptureConnectivityBannerProps = {
  online: boolean;
  savedAt?: string | null;
  pendingApply?: boolean;
  pendingCloudSync?: boolean;
};

export function CaptureConnectivityBanner({
  online,
  savedAt,
  pendingApply = false,
  pendingCloudSync = false,
}: CaptureConnectivityBannerProps) {
  const savedLabel = formatDraftSavedAt(savedAt);
  const tone = online
    ? "border-tl-line bg-tl-paper text-tl-ink"
    : "border-tl-amber/50 bg-tl-amber/10 text-tl-ink";

  let headline = online
    ? "Connection available"
    : "No connection — draft on this device";
  let detail = online
    ? "Notes stay in this browser until you apply. Same device only — not a native offline app."
    : "AI extract needs a network. Apply still required. Same browser only — TrustLedger Cloud updates when you reconnect.";

  if (pendingApply && pendingCloudSync) {
    headline = online
      ? "Apply confirmed — Cloud update pending"
      : "Apply confirmed — saved on this device";
    detail =
      "You already tapped apply. This browser will retry the Cloud write when the network is back. It will not invent a second apply.";
  } else if (pendingApply) {
    headline = online
      ? "Apply confirmed — retrying from this browser"
      : "Apply confirmed — waiting for a connection";
    detail =
      "You already tapped apply. This browser will retry that same apply (same ids) when you are back online.";
  }

  return (
    <div
      role="status"
      className={`rounded-lg border px-3 py-2 text-sm ${tone}`}
    >
      <p className="font-medium">{headline}</p>
      <p className="mt-0.5 text-xs text-tl-ink-muted">{detail}</p>
      {savedLabel ? (
        <p className="mt-1 text-xs text-tl-ink-muted">
          Last draft on this device: {savedLabel}
        </p>
      ) : null}
    </div>
  );
}
