const UTM_KEY = "tl-utm";

export type UtmAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  capturedAt: string;
  landingPath: string;
};

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function captureUtmFromSearchParams(
  searchParams: URLSearchParams,
  landingPath: string,
): UtmAttribution | null {
  if (typeof window === "undefined") return null;

  const hasUtm = UTM_PARAMS.some((key) => searchParams.get(key));
  if (!hasUtm) return readUtm();

  const attribution: UtmAttribution = {
    source: searchParams.get("utm_source") ?? undefined,
    medium: searchParams.get("utm_medium") ?? undefined,
    campaign: searchParams.get("utm_campaign") ?? undefined,
    content: searchParams.get("utm_content") ?? undefined,
    term: searchParams.get("utm_term") ?? undefined,
    capturedAt: new Date().toISOString(),
    landingPath,
  };

  window.localStorage.setItem(UTM_KEY, JSON.stringify(attribution));
  return attribution;
}

export function readUtm(): UtmAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(UTM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UtmAttribution;
  } catch {
    return null;
  }
}

export function formatUtmSummary(utm: UtmAttribution | null): string {
  if (!utm) return "None";
  return [utm.source, utm.medium, utm.campaign].filter(Boolean).join(" / ") || "Captured";
}
