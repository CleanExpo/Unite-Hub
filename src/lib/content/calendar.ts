// src/lib/content/calendar.ts
// Content calendar configuration — manages posting schedules and gap analysis per business/platform.

import type { SocialPlatform } from '@/lib/integrations/social/types'
import { createServiceClient } from '@/lib/supabase/service'

// ── Types ───────────────────────────────────────────────────────────────────────

export interface ContentCalendarConfig {
  businessKey: string
  platform: SocialPlatform
  postsPerWeek: number
  preferredTimes: string[] // AEST e.g. ['09:00', '17:30']
  enabled: boolean
}

// ── AEST Offset ─────────────────────────────────────────────────────────────────

/** AEST is UTC+10 — used to convert preferred times to UTC for DB storage. */
const AEST_OFFSET_HOURS = 10

// ── Default Configs ─────────────────────────────────────────────────────────────

export const DEFAULT_CALENDAR_CONFIGS: ContentCalendarConfig[] = [
  // CARSI — Facebook, Instagram, LinkedIn (skip TikTok/YouTube — videoRequired)
  {
    businessKey: 'carsi',
    platform: 'facebook',
    postsPerWeek: 3,
    preferredTimes: ['09:00', '17:30'],
    enabled: true,
  },
  {
    businessKey: 'carsi',
    platform: 'instagram',
    postsPerWeek: 5,
    preferredTimes: ['08:00', '12:30', '18:00'],
    enabled: true,
  },
  {
    businessKey: 'carsi',
    platform: 'linkedin',
    postsPerWeek: 2,
    preferredTimes: ['10:00'],
    enabled: true,
  },

  // RestoreAssist — Facebook, Instagram, LinkedIn (skip TikTok/YouTube — videoRequired)
  {
    businessKey: 'restore',
    platform: 'facebook',
    postsPerWeek: 3,
    preferredTimes: ['09:00', '17:00'],
    enabled: true,
  },
  {
    businessKey: 'restore',
    platform: 'instagram',
    postsPerWeek: 5,
    preferredTimes: ['08:30', '12:00', '17:30'],
    enabled: true,
  },
  {
    businessKey: 'restore',
    platform: 'linkedin',
    postsPerWeek: 2,
    preferredTimes: ['10:30'],
    enabled: true,
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────────

/**
 * Converts an AEST time string (e.g. '09:00') on a given date to a UTC Date.
 */
function aestTimeToUtc(date: Date, aestTime: string): Date {
  const [hours, minutes] = aestTime.split(':').map(Number)
  const utc = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours - AEST_OFFSET_HOURS,
    minutes,
  ))
  return utc
}

// ── Exported Functions ──────────────────────────────────────────────────────────

/**
 * Retrieves calendar configurations for a business.
 *
 * Attempts to read from `brand_identities.sample_content.calendarConfigs` in Supabase first
 * (stored as JSONB). Falls back to `DEFAULT_CALENDAR_CONFIGS` filtered by businessKey.
 */
export async function getCalendarConfigs(
  businessKey: string,
): Promise<ContentCalendarConfig[]> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('brand_identities')
    .select('sample_content')
    .eq('business_key', businessKey)
    .maybeSingle()

  // sample_content is JSONB — check for custom calendar overrides
  const sampleContent = data?.sample_content as Record<string, unknown> | null
  if (sampleContent?.calendarConfigs && Array.isArray(sampleContent.calendarConfigs)) {
    return sampleContent.calendarConfigs as ContentCalendarConfig[]
  }

  return DEFAULT_CALENDAR_CONFIGS.filter(
    (c) => c.businessKey === businessKey,
  )
}

/**
 * Finds the next available scheduled slot for a business + platform.
 *
 * Looks at existing scheduled posts, builds a set of occupied slots,
 * then walks forward through preferred time slots until a gap is found.
 * Returns the datetime in UTC (suitable for DB storage).
 */
export async function getNextScheduledSlot(
  businessKey: string,
  platform: SocialPlatform,
): Promise<Date> {
  const configs = await getCalendarConfigs(businessKey)
  const config = configs.find(
    (c) => c.platform === platform && c.enabled,
  )

  if (!config) {
    // No config for this platform — default to tomorrow 09:00 AEST
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    return aestTimeToUtc(tomorrow, '09:00')
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Look ahead 4 weeks for existing scheduled posts
  const lookAheadEnd = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)

  const { data: scheduledPosts } = await supabase
    .from('social_posts')
    .select('scheduled_at')
    .eq('business_key', businessKey)
    .contains('platforms', [platform])
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', lookAheadEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  // Build a set of occupied slot timestamps for quick lookup
  const occupiedSlots = new Set(
    (scheduledPosts ?? [])
      .map((p) => p.scheduled_at)
      .filter(Boolean)
      .map((ts: string) => new Date(ts).getTime()),
  )

  // Walk forward day-by-day, checking each preferred time slot
  for (let dayOffset = 0; dayOffset <= 28; dayOffset++) {
    const candidateDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)

    for (const time of config.preferredTimes) {
      const slotUtc = aestTimeToUtc(candidateDate, time)

      // Skip slots in the past
      if (slotUtc.getTime() <= now.getTime()) continue

      // Check whether this slot is already occupied (within 30-minute window)
      const isOccupied = Array.from(occupiedSlots).some(
        (occupied) => Math.abs(occupied - slotUtc.getTime()) < 30 * 60 * 1000,
      )

      if (!isOccupied) {
        return slotUtc
      }
    }
  }

  // Fallback: 4 weeks from now at first preferred time
  const fallbackDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)
  return aestTimeToUtc(fallbackDate, config.preferredTimes[0])
}

/**
 * Analyses content gaps for the next 7 days across all enabled platforms.
 *
 * For each enabled platform config, counts how many posts are already
 * scheduled in the upcoming week and returns the gap (postsPerWeek minus
 * scheduled count). A gap of 0 or negative means the platform is on track.
 */
export async function getContentGapsForWeek(
  businessKey: string,
): Promise<{ platform: SocialPlatform; gapCount: number }[]> {
  const configs = await getCalendarConfigs(businessKey)
  const enabledConfigs = configs.filter((c) => c.enabled)

  if (enabledConfigs.length === 0) return []

  const supabase = createServiceClient()
  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Fetch all scheduled posts for this business in the next 7 days
  const { data: scheduledPosts } = await supabase
    .from('social_posts')
    .select('platforms, scheduled_at')
    .eq('business_key', businessKey)
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', weekEnd.toISOString())

  const posts = scheduledPosts ?? []

  return enabledConfigs.map((config) => {
    // Count posts that include this platform
    const scheduledCount = posts.filter((post) =>
      Array.isArray(post.platforms) && post.platforms.includes(config.platform),
    ).length

    const gapCount = Math.max(0, config.postsPerWeek - scheduledCount)

    return {
      platform: config.platform,
      gapCount,
    }
  })
}
