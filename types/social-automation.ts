export type SocialAutomationSchedule = {
  id: number
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  platforms: string[]
  schedule_type: "one-time" | "recurring" | "queue"
  frequency: "daily" | "weekly" | "monthly" | "custom" | null
  days_of_week: number[] | null
  times_of_day: string[] | null
  start_date: string | null
  end_date: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export type SocialAutomationPost = {
  id: number
  user_id: string
  schedule_id: number | null
  content: string
  image_url: string | null
  template_id: number | null
  variables: Record<string, string>
  platforms: string[]
  status: "pending" | "scheduled" | "posted" | "failed"
  scheduled_time: string | null
  posted_time: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export type SocialAutomationQueue = {
  id: number
  user_id: string
  schedule_id: number
  post_id: number
  position: number
  is_processed: boolean
  created_at: string
  updated_at: string
}

export type SocialEngagementRule = {
  id: number
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  platform: string
  action_type: "like" | "comment" | "follow" | "retweet"
  trigger_type: "hashtag" | "keyword" | "user" | "location"
  trigger_value: string
  response_template: string | null
  frequency_limit: number
  created_at: string
  updated_at: string
}

export type SocialEngagementAction = {
  id: number
  user_id: string
  rule_id: number
  platform: string
  action_type: string
  target_id: string
  target_url: string | null
  status: "pending" | "completed" | "failed"
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export type SocialOptimalTime = {
  id: number
  user_id: string
  platform: string
  day_of_week: number
  hour_of_day: number
  engagement_score: number
  data_points: number
  last_updated: string
}
