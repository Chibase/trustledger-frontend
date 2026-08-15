import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";
import { getCurrentUser } from "@/lib/auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AppProjectDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <ProjectDetailClient
      params={params}
      role={user.role}
      authorName={user.name}
    />
  );
}
