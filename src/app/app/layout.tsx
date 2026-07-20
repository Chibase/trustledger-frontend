import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getCurrentUser } from "@/lib/auth";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Live without session: middleware sends to /login/live; keep a hard stop.
  if (!user) {
    redirect("/login/live");
  }

  return (
    <AppShell
      role={user.role}
      userName={user.name}
      showDemoBanner={user.mode !== "live"}
      trialPlan={user.trialPlan}
      isGuest={Boolean(user.isGuest)}
    >
      {children}
    </AppShell>
  );
}
