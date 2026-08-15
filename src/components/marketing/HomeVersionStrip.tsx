import {
  VERSION_001_SUMMARY,
  VERSION_002_SUMMARY,
} from "@/config/productVersion";

/** Capability strip for marketing — modules only, no internal version labels (ADR-044). */
export function HomeVersionStrip() {
  return (
    <section
      className="border-b border-tl-line bg-tl-paper"
      aria-label="Product capabilities"
    >
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Grievance resolution desk
          </p>
          <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
            {VERSION_001_SUMMARY}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Stakeholder Intelligence
          </p>
          <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
            {VERSION_002_SUMMARY} South African place packs are included
            baseline for SA plans; the product is built for Global South
            programmes.
          </p>
        </div>
      </div>
    </section>
  );
}
