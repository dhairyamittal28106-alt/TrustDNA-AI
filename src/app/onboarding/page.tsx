import { OnboardingWizard } from "@/components/onboarding-wizard";
import { ProtectedRoute } from "@/components/protected-route";

export default function OnboardingPage() {
  return <ProtectedRoute><OnboardingWizard /></ProtectedRoute>;
}
