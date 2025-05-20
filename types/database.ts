export type UserProfile = {
  id: number
  user_id: string
  full_name: string | null
  job_title: string | null
  company: string | null
  bio: string | null
  avatar_url: string | null
  onboarding_completed: boolean
  onboarding_completed_at: string | null
  onboarding_skipped: boolean
  created_at: string
  updated_at: string
}

export type UserPreferences = {
  id: number
  user_id: string
  email_notifications: boolean
  marketing_emails: boolean
  theme: string
  language: string
  timezone: string
  created_at: string
  updated_at: string
}

export type UserInterests = {
  id: number
  user_id: string
  interests: string[]
  created_at: string
  updated_at: string
}

export type Tables = {
  user_profiles: UserProfile
  user_preferences: UserPreferences
  user_interests: UserInterests
}
