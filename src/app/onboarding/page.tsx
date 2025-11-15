"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { isOnboarding, isComplete, loading } = useOnboarding();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!authLoading && !loading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push("/login");
      } else if (isComplete) {
        // Onboarding complete, redirect to dashboard
        router.push("/dashboard/overview");
      } else if (isOnboarding) {
        // Show onboarding wizard
        setShowWizard(true);
      } else {
        // No onboarding record, redirect to dashboard
        router.push("/dashboard/overview");
      }
    }
  }, [user, isOnboarding, isComplete, loading, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard
        open={showWizard}
        onClose={() => router.push("/dashboard/overview")}
      />
    </div>
  );
}
