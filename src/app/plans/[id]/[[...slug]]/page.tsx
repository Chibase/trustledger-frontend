import { redirect } from "next/navigation";
import { dashboardHrefFromLegacySlug } from "@/lib/planPackaging";

type Props = {
  params: Promise<{ id: string; slug?: string[] }>;
};

/**
 * Legacy bookmarks `/plans/:id/sep` and `/plans/:id/modules/sep`
 * land on the existing `/app/...` module dashboards.
 */
export default async function LegacyPlanDashboardRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(dashboardHrefFromLegacySlug(slug));
}
