/**
 * Browser connection helpers for Capture low-connectivity drafts.
 * `navigator.onLine` is a hint — not a guarantee the Cloud host is reachable.
 */

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

export function subscribeBrowserConnection(
  listener: (online: boolean) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const onOnline = () => listener(true);
  const onOffline = () => listener(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

export function isLikelyNetworkFailure(err: unknown): boolean {
  if (!isBrowserOnline()) return true;
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "";
  return /failed to fetch|networkerror|network request failed|load failed|offline|err_internet|network/i.test(
    message,
  );
}

export function shouldRetryPendingOnHydrate(
  online: boolean,
  hasPendingApply: boolean,
): boolean {
  return online && hasPendingApply;
}

export function formatDraftSavedAt(
  iso: string | undefined | null,
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
