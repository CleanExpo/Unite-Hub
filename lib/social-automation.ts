import { supabase } from "./supabase"
import type {
  SocialAutomationSchedule,
  SocialAutomationPost,
  SocialEngagementRule,
  SocialOptimalTime,
} from "@/types/social-automation"

// Get all automation schedules for the current user
export async function getUserAutomationSchedules(userId: string) {
  const { data, error } = await supabase
    .from("social_automation_schedules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching automation schedules:", error)
    return []
  }

  return data as SocialAutomationSchedule[]
}

// Get automation schedule by ID
export async function getAutomationScheduleById(scheduleId: number) {
  const { data, error } = await supabase.from("social_automation_schedules").select("*").eq("id", scheduleId).single()

  if (error) {
    console.error("Error fetching automation schedule:", error)
    return null
  }

  return data as SocialAutomationSchedule
}

// Create a new automation schedule
export async function createAutomationSchedule(
  schedule: Omit<SocialAutomationSchedule, "id" | "created_at" | "updated_at">,
) {
  const { data, error } = await supabase
    .from("social_automation_schedules")
    .insert([
      {
        ...schedule,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) {
    console.error("Error creating automation schedule:", error)
    throw error
  }

  return data[0] as SocialAutomationSchedule
}

// Update an existing automation schedule
export async function updateAutomationSchedule(
  scheduleId: number,
  updates: Partial<Omit<SocialAutomationSchedule, "id" | "created_at" | "updated_at" | "user_id">>,
) {
  const { data, error } = await supabase
    .from("social_automation_schedules")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scheduleId)
    .select()

  if (error) {
    console.error("Error updating automation schedule:", error)
    throw error
  }

  return data[0] as SocialAutomationSchedule
}

// Delete an automation schedule
export async function deleteAutomationSchedule(scheduleId: number) {
  const { error } = await supabase.from("social_automation_schedules").delete().eq("id", scheduleId)

  if (error) {
    console.error("Error deleting automation schedule:", error)
    throw error
  }

  return true
}

// Get all scheduled posts for a specific schedule
export async function getScheduledPosts(scheduleId: number) {
  const { data, error } = await supabase
    .from("social_automation_posts")
    .select("*")
    .eq("schedule_id", scheduleId)
    .order("scheduled_time", { ascending: true })

  if (error) {
    console.error("Error fetching scheduled posts:", error)
    return []
  }

  return data as SocialAutomationPost[]
}

// Create a new scheduled post
export async function createScheduledPost(
  post: Omit<SocialAutomationPost, "id" | "created_at" | "updated_at" | "posted_time" | "error_message">,
) {
  const { data, error } = await supabase
    .from("social_automation_posts")
    .insert([
      {
        ...post,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) {
    console.error("Error creating scheduled post:", error)
    throw error
  }

  return data[0] as SocialAutomationPost
}

// Get all engagement rules for the current user
export async function getUserEngagementRules(userId: string) {
  const { data, error } = await supabase
    .from("social_engagement_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching engagement rules:", error)
    return []
  }

  return data as SocialEngagementRule[]
}

// Create a new engagement rule
export async function createEngagementRule(rule: Omit<SocialEngagementRule, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("social_engagement_rules")
    .insert([
      {
        ...rule,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) {
    console.error("Error creating engagement rule:", error)
    throw error
  }

  return data[0] as SocialEngagementRule
}

// Update an existing engagement rule
export async function updateEngagementRule(
  ruleId: number,
  updates: Partial<Omit<SocialEngagementRule, "id" | "created_at" | "updated_at" | "user_id">>,
) {
  const { data, error } = await supabase
    .from("social_engagement_rules")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId)
    .select()

  if (error) {
    console.error("Error updating engagement rule:", error)
    throw error
  }

  return data[0] as SocialEngagementRule
}

// Delete an engagement rule
export async function deleteEngagementRule(ruleId: number) {
  const { error } = await supabase.from("social_engagement_rules").delete().eq("id", ruleId)

  if (error) {
    console.error("Error deleting engagement rule:", error)
    throw error
  }

  return true
}

// Get optimal posting times for a specific platform
export async function getOptimalPostingTimes(userId: string, platform: string) {
  const { data, error } = await supabase
    .from("social_optimal_times")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .order("engagement_score", { ascending: false })

  if (error) {
    console.error("Error fetching optimal posting times:", error)
    return []
  }

  return data as SocialOptimalTime[]
}

// Calculate next posting times based on schedule
export function calculateNextPostingTimes(schedule: SocialAutomationSchedule, count = 5): Date[] {
  const result: Date[] = []
  const now = new Date()
  const startDate = schedule.start_date ? new Date(schedule.start_date) : now
  const endDate = schedule.end_date ? new Date(schedule.end_date) : null

  if (schedule.schedule_type === "one-time" && schedule.start_date) {
    result.push(new Date(schedule.start_date))
    return result
  }

  if (schedule.schedule_type === "recurring") {
    const currentDate = new Date(Math.max(startDate.getTime(), now.getTime()))

    while (result.length < count) {
      if (endDate && currentDate > endDate) break

      const dayOfWeek = currentDate.getDay()

      if (!schedule.days_of_week || schedule.days_of_week.includes(dayOfWeek)) {
        if (schedule.times_of_day && schedule.times_of_day.length > 0) {
          for (const timeStr of schedule.times_of_day) {
            const [hours, minutes] = timeStr.split(":").map(Number)
            const postTime = new Date(currentDate)
            postTime.setHours(hours, minutes, 0, 0)

            if (postTime > now) {
              result.push(postTime)
              if (result.length >= count) break
            }
          }
        } else {
          // Default to noon if no times specified
          const postTime = new Date(currentDate)
          postTime.setHours(12, 0, 0, 0)

          if (postTime > now) {
            result.push(postTime)
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
      currentDate.setHours(0, 0, 0, 0)
    }
  }

  return result.slice(0, count).sort((a, b) => a.getTime() - b.getTime())
}
