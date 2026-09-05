import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OpsShell } from "@/components/ops/OpsShell";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentUser } from "@/lib/auth";
import { FRAPPE_SID_COOKIE } from "@/lib/auth.constants";
import {
  assertOpsAccess,
} from "@/lib/platformOperator";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  if (!user || user.mode !== "live" || !sid) {
    redirect("/login/live?next=/ops/executive");
  }

  const gate = assertOpsAccess(user.email);
  if (!gate.ok) {
    redirect(`/login/live?error=${gate.reason}&next=/ops/executive`);
  }

  return (
    <ToastProvider>
      <OpsShell
        operatorName={user.name}
        operatorEmail={user.email || "operator"}
      >
        {children}
      </OpsShell>
    </ToastProvider>
  );
}
