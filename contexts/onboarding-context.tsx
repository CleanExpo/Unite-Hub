"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserInterests,
  updateUserInterests,
  completeOnboarding,
} from "@/lib/db"

type OnboardingStep = "welcome" | "profile" | "preferences" | "services" | "complete"

interface OnboardingContextType {
  currentStep: OnboardingStep
  isCompleted: boolean
  progress: number
  goToStep: (step: OnboardingStep) => void
  nextStep: () => void
  prevStep: () => void
  completeOnboarding: () => Promise<void>
  skipOnboarding: () => Promise<void>
  updateProfile: (data: any) => Promise<void>
  updatePreferences: (data: any) => Promise<void>
  updateServices: (data: any) => Promise<void>
  profileData: any
  preferencesData: any
  servicesData: any
  isLoading: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const STEPS: OnboardingStep[] = ["welcome", "profile", "preferences", "services", "complete"]

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
  const [isCompleted, setIsCompleted] = useState(false)
  const [profileData, setProfileData] = useState({})
  const [preferencesData, setPreferencesData] = useState({})
  const [servicesData, setServicesData] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // Calculate progress percentage
  const progress = Math.round(((STEPS.indexOf(currentStep) + 1) / STEPS.length) * 100)

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setIsLoading(true)
        try {
          // Load profile data
          const profile = await getUserProfile(user.id)
          if (profile) {
            setProfileData({
              fullName: profile.full_name || "",
              jobTitle: profile.job_title || "",
              company: profile.company || "",
              bio: profile.bio || "",
              avatarUrl: profile.avatar_url || "",
            })
            setIsCompleted(profile.onboarding_completed || false)
          }

          // Load preferences
          const preferences = await getUserPreferences(user.id)
          if (preferences) {
            setPreferencesData({
              emailNotifications: preferences.email_notifications,
              marketingEmails: preferences.marketing_emails,
              theme: preferences.theme,
              language: preferences.language,
              timezone: preferences.timezone,
            })
          }

          // Load interests
          const interests = await getUserInterests(user.id)
          if (interests) {
            setServicesData({
              interests: interests.interests || [],
            })
          }
        } catch (error) {
          console.error("Error loading user data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadUserData()
  }, [user])

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step)
  }

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1])
    }
  }

  const updateProfile = async (data: any) => {
    setProfileData({ ...profileData, ...data })

    if (user) {
      try {
        // Update user metadata
        await updateUserProfile(user.id, {
          full_name: data.fullName,
          job_title: data.jobTitle,
          company: data.company,
          bio: data.bio,
          avatar_url: data.avatarUrl,
        })
      } catch (error) {
        console.error("Error updating profile:", error)
        throw error
      }
    }
  }

  const updatePreferences = async (data: any) => {
    setPreferencesData({ ...preferencesData, ...data })

    if (user) {
      try {
        await updateUserPreferences(user.id, {
          email_notifications: data.emailNotifications,
          marketing_emails: data.marketingEmails,
          theme: data.theme,
          language: data.language,
          timezone: data.timezone,
        })
      } catch (error) {
        console.error("Error updating preferences:", error)
        throw error
      }
    }
  }

  const updateServices = async (data: any) => {
    setServicesData({ ...servicesData, ...data })

    if (user) {
      try {
        await updateUserInterests(user.id, data.interests)
      } catch (error) {
        console.error("Error updating services interests:", error)
        throw error
      }
    }
  }

  const completeOnboardingFlow = async () => {
    if (user) {
      try {
        await completeOnboarding(user.id, false)
        setIsCompleted(true)
        router.push("/dashboard")
      } catch (error) {
        console.error("Error completing onboarding:", error)
        throw error
      }
    }
  }

  const skipOnboardingFlow = async () => {
    if (user) {
      try {
        await completeOnboarding(user.id, true)
        setIsCompleted(true)
        router.push("/dashboard")
      } catch (error) {
        console.error("Error skipping onboarding:", error)
        throw error
      }
    }
  }

  const value = {
    currentStep,
    isCompleted,
    progress,
    goToStep,
    nextStep,
    prevStep,
    completeOnboarding: completeOnboardingFlow,
    skipOnboarding: skipOnboardingFlow,
    updateProfile,
    updatePreferences,
    updateServices,
    profileData,
    preferencesData,
    servicesData,
    isLoading,
  }

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
