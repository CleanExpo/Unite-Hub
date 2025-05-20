"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import { WelcomeStep } from "@/components/onboarding/welcome-step"
import { ProfileStep } from "@/components/onboarding/profile-step"
import { PreferencesStep } from "@/components/onboarding/preferences-step"
import { ServicesStep } from "@/components/onboarding/services-step"
import { CompleteStep } from "@/components/onboarding/complete-step"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"

export function OnboardingFlow() {
  const { currentStep, progress, isLoading } = useOnboarding()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="h-2 bg-[#001428] rounded-full overflow-hidden mb-8">
              <div className="h-full bg-[#4ecdc4] rounded-full animate-pulse" style={{ width: "20%" }}></div>
            </div>

            <div className="mt-8 bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-8 border border-[#4ecdc4]/20 shadow-lg">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#4ecdc4]"></div>
                <p className="mt-4 text-white">Loading your profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-3xl mx-auto">
          <OnboardingProgress progress={progress} />

          <div className="mt-8 bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-8 border border-[#4ecdc4]/20 shadow-lg">
            {currentStep === "welcome" && <WelcomeStep />}
            {currentStep === "profile" && <ProfileStep />}
            {currentStep === "preferences" && <PreferencesStep />}
            {currentStep === "services" && <ServicesStep />}
            {currentStep === "complete" && <CompleteStep />}
          </div>
        </div>
      </div>
    </div>
  )
}
