import { redirect } from "next/navigation";
import { OpsShell } from "@/components/ops/OpsShell";
import { getCurrentUser } from "@/lib/auth";
import {
  assertOpsAccess,
} from "@/lib/platformOperator";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.mode !== "live") {
    redirect("/login/live?next=/ops");
  }

  const gate = assertOpsAccess(user.email);
  if (!gate.ok) {
    redirect(`/login/live?error=${gate.reason}&next=/ops`);
  }

  return (
    <OpsShell
      operatorName={user.name}
      operatorEmail={user.email || "operator"}
    >
      {children}
    </OpsShell>
  );
}
