import { redirect } from "next/navigation";

// Onboarding v1 — replaced by Nexus 2.0 setup flow
export default function OnboardingStep1Page() {
  redirect("/founder/dashboard");
}
