import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
  VERSION_001_SUMMARY,
  VERSION_002_SUMMARY,
} from "@/config/productVersion";

/** Honest Now / Next strip for marketing — ADR-023. */
export function HomeVersionStrip() {
  return (
    <section
      className="border-b border-tl-line bg-tl-paper"
      aria-label="Product versions"
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Available now · {PRODUCT_VERSION_LABEL}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
            {VERSION_001_SUMMARY}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-amber">
            In active development · {NEXT_PRODUCT_VERSION_LABEL}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
            {VERSION_002_SUMMARY} South African geo and socio-economic depth is a
            first-class priority.
          </p>
        </div>
      </div>
    </section>
  );
}
