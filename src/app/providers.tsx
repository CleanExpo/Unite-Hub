"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { ThemeProvider } from "next-themes";
// import { OnboardingProvider } from "@/contexts/OnboardingContext"; // Disabled until user_onboarding table exists
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SupabaseProvider>
        <ToastProvider>
          <AuthProvider>
            {/* OnboardingProvider disabled - table doesn't exist yet */}
            {/* <OnboardingProvider> */}
              {children}
            {/* </OnboardingProvider> */}
          </AuthProvider>
        </ToastProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}
