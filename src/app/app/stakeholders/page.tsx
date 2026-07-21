import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { stakeholderService } from "@/services/stakeholderService";
import { geoService } from "@/services/geoService";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";

export default async function AppStakeholdersPage() {
  const rows = await stakeholderService.list();
  const withPlace = await Promise.all(
    rows.map(async (row) => ({
      row,
      place: row.placeId ? await geoService.getPlace(row.placeId) : null,
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${NEXT_PRODUCT_VERSION_LABEL} (in build) · ${PRODUCT_VERSION_LABEL} desk stays live`}
        title="Stakeholder registry"
        description="Single place for people, organisations, and community structures — linked to geography. Seed data for Version 002; full create/edit and Frappe sync follow in packet 24b."
        actions={
          <Link
            href="/app/geo"
            className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            View places
          </Link>
        }
      />

      <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
        {withPlace.map(({ row, place }) => (
          <li key={row.id} className="px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-tl-ink">{row.name}</h2>
              <span className="text-xs capitalize text-tl-ink-muted">
                {row.kind.replaceAll("_", " ")}
                {row.influence ? ` · ${row.influence} influence` : ""}
              </span>
            </div>
            {row.summary ? (
              <p className="mt-1 text-sm text-tl-ink-muted">{row.summary}</p>
            ) : null}
            <p className="mt-2 text-xs text-tl-ink-muted">
              {place ? place.name : "No place linked"}
              {row.interests?.length
                ? ` · ${row.interests.join(", ")}`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
