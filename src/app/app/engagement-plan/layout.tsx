import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessSepDesk } from "@/lib/sepAccess";

/**
 * Server gate so a bookmarked /app/engagement-plan URL cannot open the
 * unfinished composer on a commercial workspace.
 */
export default async function EngagementPlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!canAccessSepDesk({ email: user?.email, isVip: user?.isVip })) {
    redirect("/app/dashboard");
  }
  return children;
}
