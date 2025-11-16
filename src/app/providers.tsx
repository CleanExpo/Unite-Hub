"use client";

import { AuthProvider } from "@/contexts/AuthContext";
// import { OnboardingProvider } from "@/contexts/OnboardingContext"; // Disabled until user_onboarding table exists
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {/* OnboardingProvider disabled - table doesn't exist yet */}
      {/* <OnboardingProvider> */}
        {children}
      {/* </OnboardingProvider> */}
    </AuthProvider>
  );
}
