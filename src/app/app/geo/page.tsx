import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { geoService } from "@/services/geoService";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";

export default async function AppGeoPage() {
  const [provinces, wards, metro] = await Promise.all([
    geoService.listPlaces("za"),
    geoService.listWards(),
    geoService.getPlace("za-gp-jhb"),
  ]);
  const indicators = metro
    ? await geoService.indicatorsForPlace(metro.id)
    : [];
  const wardIndicators = await geoService.indicatorsForPlace("za-gp-jhb-w12");
  const wardRows = await Promise.all(
    wards.map(async (ward) => ({
      ward,
      crumbs: await geoService.breadcrumbs(ward.id),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${PRODUCT_VERSION_LABEL} → ${NEXT_PRODUCT_VERSION_LABEL}`}
        title="Geographic intelligence"
        description="South African place hierarchy and socio-economic context for stakeholders, grievances, and ESG packs. Starter demo data — your ward and Stats layers plug in next."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Provinces in seed" value={String(provinces.length)} />
        <KpiCard label="Wards in seed" value={String(wards.length)} />
        <KpiCard
          label="Indicators (Ward 12)"
          value={String(wardIndicators.length)}
        />
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold text-tl-ink">Place tree</h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Country → province → metro → ward. Link projects, stakeholders, and
          incidents to a place id.
        </p>
        <ul className="mt-4 divide-y divide-tl-line rounded-md border border-tl-line">
          {wardRows.map(({ ward, crumbs }) => (
            <li key={ward.id} className="px-3 py-3 text-sm">
              <p className="font-medium text-tl-ink">{ward.name}</p>
              <p className="mt-0.5 text-xs text-tl-ink-muted">
                {crumbs.map((c) => c.name).join(" · ")}
                <span className="ml-2 font-mono text-[0.7rem] text-tl-ink-muted">
                  {ward.code}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold text-tl-ink">
          Socio-economic indicators (sample)
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Replace with your municipal / Stats SA extracts. These power Version
          002 executive and ESG packs.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[...indicators, ...wardIndicators].map((row) => (
            <li
              key={`${row.placeId}-${row.key}`}
              className="rounded-md border border-tl-line bg-tl-paper px-3 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                {row.label}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-tl-ink">
                {row.value}
                <span className="ml-1 text-sm font-sans font-normal text-tl-ink-muted">
                  {row.unit}
                </span>
              </p>
              <p className="mt-1 text-xs text-tl-ink-muted">
                {row.source}
                {row.year ? ` · ${row.year}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-tl-ink-muted">
        Next packet: stakeholders registry (24b). Drop geo/socio-econ files in
        the repo to replace this seed.{" "}
        <Link href="/app/dashboard" className="text-tl-trust-ink underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
