import { supabase } from "./supabase"
import type { Tables } from "@/types/database"

// User Profile Functions
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data as Tables["user_profiles"]
}

export async function updateUserProfile(userId: string, profileData: Partial<Tables["user_profiles"]>) {
  const { error } = await supabase.from("user_profiles").upsert({
    user_id: userId,
    ...profileData,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error updating user profile:", error)
    throw error
  }

  return true
}

// User Preferences Functions
export async function getUserPreferences(userId: string) {
  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is the error code for "no rows returned"
    console.error("Error fetching user preferences:", error)
    return null
  }

  return data as Tables["user_preferences"] | null
}

export async function updateUserPreferences(userId: string, preferencesData: Partial<Tables["user_preferences"]>) {
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: userId,
    ...preferencesData,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error updating user preferences:", error)
    throw error
  }

  return true
}

// User Interests Functions
export async function getUserInterests(userId: string) {
  const { data, error } = await supabase.from("user_interests").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user interests:", error)
    return null
  }

  return data as Tables["user_interests"] | null
}

export async function updateUserInterests(userId: string, interests: string[]) {
  const { error } = await supabase.from("user_interests").upsert({
    user_id: userId,
    interests,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error updating user interests:", error)
    throw error
  }

  return true
}

// Onboarding Status Functions
export async function checkOnboardingStatus(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("onboarding_completed, onboarding_skipped")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error checking onboarding status:", error)
    return { completed: false, skipped: false }
  }

  return {
    completed: data.onboarding_completed || false,
    skipped: data.onboarding_skipped || false,
  }
}

export async function completeOnboarding(userId: string, skipped = false) {
  const { error } = await supabase.from("user_profiles").upsert({
    user_id: userId,
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    onboarding_skipped: skipped,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error completing onboarding:", error)
    throw error
  }

  return true
}
