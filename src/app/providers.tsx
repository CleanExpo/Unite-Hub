"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
// import { OnboardingProvider } from "@/contexts/OnboardingContext"; // Disabled until user_onboarding table exists
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        {/* OnboardingProvider disabled - table doesn't exist yet */}
        {/* <OnboardingProvider> */}
          {children}
        {/* </OnboardingProvider> */}
      </AuthProvider>
    </ToastProvider>
  );
}
