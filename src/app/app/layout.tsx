import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { isLiveMode } from "@/config/api";
import { getCurrentUser } from "@/lib/auth";
import {
  assertLiveOperatorAccess,
  isPlatformOperatorOnly,
} from "@/lib/platformOperator";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      isLiveMode()
        ? "/login/live?next=/app/dashboard"
        : "/demo?next=/app/dashboard",
    );
  }

  if (user.mode === "live" && isPlatformOperatorOnly()) {
    const gate = assertLiveOperatorAccess(user.email);
    if (!gate.ok) {
      redirect(`/login/live?error=${gate.reason}`);
    }
  }

  const showOperatorBanner =
    user.mode === "live" && isPlatformOperatorOnly();

  return (
    <AppShell
      role={user.role}
      userName={user.name}
      mode={user.mode}
      showDemoBanner={user.mode !== "live"}
      trialPlan={user.trialPlan}
      isGuest={Boolean(user.isGuest)}
      showOperatorBanner={showOperatorBanner}
    >
      {children}
    </AppShell>
  );
}
