import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { geoService } from "@/services/geoService";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";

type SearchParams = Promise<{ province?: string; muni?: string }>;

export default async function AppGeoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const pack = await geoService.getPack();
  const counts = await geoService.countsByLevel();
  const provinces = await geoService.listPlaces({ level: "province", limit: 50 });
  const traditional = await geoService.listPlaces({
    level: "traditional_council",
    limit: 100,
  });

  const provinceId = sp.province || provinces[0]?.id;
  const districts = provinceId
    ? await geoService.listPlaces({ parentId: provinceId, limit: 100 })
    : [];
  const munis = (
    await Promise.all(
      districts.map((d) =>
        geoService.listPlaces({ parentId: d.id, limit: 200 }),
      ),
    )
  ).flat();
  const muniId = sp.muni || munis[0]?.id;
  const wards = muniId
    ? await geoService.listPlaces({
        parentId: muniId,
        level: "ward",
        limit: 200,
      })
    : [];
  const crumbs = muniId ? await geoService.breadcrumbs(muniId) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${PRODUCT_VERSION_LABEL} → ${NEXT_PRODUCT_VERSION_LABEL}`}
        title="Geographic intelligence"
        description={
          pack
            ? `${pack.pack.label}. Pre-installed for demos — add another country pack under data/geo/ without changing the product model. Stats SA socio-economic layers attach later.`
            : "No geo pack loaded."
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Provinces" value={String(counts.province ?? 0)} />
        <KpiCard label="Municipalities" value={String((counts.local_municipality ?? 0) + (counts.metro ?? 0))} />
        <KpiCard label="Wards (MDB 2020)" value={String(counts.ward ?? 0)} />
        <KpiCard
          label="Traditional councils"
          value={String(counts.traditional_council ?? 0)}
        />
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold text-tl-ink">Browse by province</h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Full national ward set is loaded for ZA. Pick a province, then a
          municipality, to inspect wards — same pattern will work for Namibia,
          Botswana, and other regional packs.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {provinces.map((p) => (
            <Link
              key={p.id}
              href={`/app/geo?province=${encodeURIComponent(p.id)}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                p.id === provinceId
                  ? "bg-tl-trust text-white"
                  : "border border-tl-line bg-tl-paper text-tl-ink hover:bg-tl-surface"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>

        {munis.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-tl-ink">Municipalities</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {munis.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/app/geo?province=${encodeURIComponent(provinceId!)}&muni=${encodeURIComponent(m.id)}`}
                    className={`block rounded-md border px-3 py-2 text-sm ${
                      m.id === muniId
                        ? "border-tl-trust bg-tl-trust/5 text-tl-trust-ink"
                        : "border-tl-line hover:bg-tl-paper"
                    }`}
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="mt-0.5 block text-xs text-tl-ink-muted">
                      {m.code} · {m.level.replaceAll("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {muniId ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-tl-ink">
              Wards · {crumbs.map((c) => c.name).join(" · ")}
            </h3>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Showing {wards.length} wards (cap 200 in this view).
            </p>
            <ul className="mt-3 grid max-h-80 gap-1 overflow-y-auto rounded-md border border-tl-line p-2 sm:grid-cols-3 md:grid-cols-4">
              {wards.map((w) => (
                <li
                  key={w.id}
                  className="rounded px-2 py-1.5 text-sm text-tl-ink hover:bg-tl-paper"
                >
                  {w.name}
                  <span className="ml-1 font-mono text-[0.65rem] text-tl-ink-muted">
                    {w.code}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold text-tl-ink">
          Traditional councils (seed)
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          From your Frappe import CSV — linked into the district hierarchy where
          names match.
        </p>
        <ul className="mt-4 divide-y divide-tl-line rounded-md border border-tl-line">
          {traditional.map((t) => (
            <li key={t.id} className="px-3 py-3 text-sm">
              <p className="font-medium text-tl-ink">{t.name}</p>
              <p className="mt-0.5 text-xs text-tl-ink-muted">
                {t.code}
                {t.meta?.kingdom ? ` · ${t.meta.kingdom}` : ""}
                {t.meta?.administrativeSeat
                  ? ` · seat ${t.meta.administrativeSeat}`
                  : ""}
                {t.meta?.status ? ` · ${t.meta.status}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-tl-ink-muted">
        Socio-economic indicators: placeholder ready in the pack file — add Stats
        SA (or other country) CSV when available.{" "}
        <Link href="/app/stakeholders" className="text-tl-trust-ink underline">
          Open stakeholder CRM
        </Link>
      </p>
    </div>
  );
}
