import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getCurrentUser } from "@/lib/auth";

export default async function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/demo");
  }

  return (
    <AppShell
      role={user.role}
      userName={user.name}
      mode={user.mode}
      showDemoBanner={user.mode !== "live"}
      showLeadGate={user.mode !== "live"}
    >
      {children}
    </AppShell>
  );
}
