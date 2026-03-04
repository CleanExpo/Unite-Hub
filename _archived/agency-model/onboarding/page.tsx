"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Onboarding page - Currently disabled
 *
 * The OnboardingProvider and user_onboarding table don't exist yet.
 * This page simply redirects to the dashboard.
 *
 * TODO: Re-enable when user_onboarding table is created and OnboardingProvider is restored
 */
export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not authenticated, redirect to login
        router.push("/login");
      } else {
        // Onboarding disabled - redirect directly to dashboard
        router.push("/dashboard/overview");
      }
    }
  }, [user, authLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
