import { OnboardingGuidePanel } from "@/components/onboarding/OnboardingGuidePanel";
import { getCurrentUser } from "@/lib/auth";

export default async function AppGuidePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return <OnboardingGuidePanel planId={user.trialPlan} />;
}
