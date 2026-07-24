import { NextResponse } from "next/server";
import { geoService } from "@/services/geoService";
import type { GeoLevel } from "@/types/geo";

/**
 * Client-safe geo queries for cascaded place pickers.
 * GET ?parentId=… | ?level=ward | ?id=… (ancestors) | ?counts=1
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const parentId = searchParams.get("parentId");
  const level = searchParams.get("level") as GeoLevel | null;
  const query = searchParams.get("query") || undefined;
  const limit = Number(searchParams.get("limit") || "400");
  const ancestors = searchParams.get("ancestors") === "1";
  const counts = searchParams.get("counts") === "1";

  try {
    if (counts) {
      return NextResponse.json({
        counts: await geoService.countsByLevel(),
      });
    }
    if (id && ancestors) {
      const crumbs = await geoService.breadcrumbs(id);
      return NextResponse.json({ breadcrumbs: crumbs });
    }
    if (id && !ancestors) {
      const place = await geoService.getPlace(id);
      return NextResponse.json({ place });
    }
    const places = await geoService.listPlaces({
      parentId: parentId === null ? undefined : parentId || undefined,
      level: level || undefined,
      query,
      limit: Number.isFinite(limit) ? limit : 400,
    });
    // Support parentId= empty string as country children via parentId=za
    return NextResponse.json({ places });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Geo query failed",
      },
      { status: 500 },
    );
  }
}
