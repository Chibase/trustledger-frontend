import { VipCommentsPanel } from "@/components/vip/VipCommentsPanel";
import { getCurrentUser } from "@/lib/auth";
import { isVipViewer } from "@/lib/vipAccess";

export default async function AppCommentsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const viewer = isVipViewer(user);
  const isPlanOwner =
    user.isPlanOwner === true ||
    (user.role === "admin" && Boolean(user.isVipOrg || user.orgId));

  return (
    <VipCommentsPanel
      orgId={user.orgId}
      userName={user.name}
      userEmail={user.email}
      isViewer={viewer}
      canExport={Boolean(user.isVipOrg && isPlanOwner && !viewer)}
    />
  );
}
