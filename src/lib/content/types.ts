// src/lib/content/types.ts
// Type definitions for the AI content generation engine.

import type { SocialPlatform } from '@/lib/integrations/social/types'

// ── Brand Identity ──────────────────────────────────────────────────────────

export interface CharacterPersona {
  name: string
  persona: string
  avatarUrl: string | null
  voiceStyle: string
  heygenAvatarId?: string
  heygenVoiceId?: string
}

export interface BrandIdentity {
  id: string
  founderId: string
  businessKey: string
  toneOfVoice: string
  targetAudience: string
  industryKeywords: string[]
  uniqueSellingPoints: string[]
  characterMale: CharacterPersona
  characterFemale: CharacterPersona
  colourPrimary: string | null
  colourSecondary: string | null
  doList: string[]
  dontList: string[]
  sampleContent: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ── Generated Content ───────────────────────────────────────────────────────

export const CONTENT_TYPES = [
  'social_post',
  'blog_intro',
  'email_campaign',
  'video_script',
  'thread',
] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const GENERATION_SOURCES = [
  'cron_auto',
  'manual_request',
  'repurpose',
] as const
export type GenerationSource = (typeof GENERATION_SOURCES)[number]

export const CONTENT_STATUSES = [
  'generated',
  'approved',
  'rejected',
  'published',
] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export interface GeneratedContent {
  id: string
  founderId: string
  businessKey: string
  contentType: ContentType
  platform: SocialPlatform | null
  title: string | null
  body: string
  mediaPrompt: string | null
  mediaUrls: string[]
  hashtags: string[]
  cta: string | null
  characterUsed: 'male' | 'female' | null
  aiModel: string | null
  inputTokens: number | null
  outputTokens: number | null
  generationSource: GenerationSource
  socialPostId: string | null
  status: ContentStatus
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ── Content Generation Request / Response ────────────────────────────────────

export interface ContentGenerationRequest {
  businessKey: string
  contentType: ContentType
  platform?: SocialPlatform
  topic?: string
  characterPreference?: 'male' | 'female' | 'none'
  count?: number // how many variants to generate (default 3)
}

export interface ContentGenerationResult {
  title: string
  body: string
  hashtags: string[]
  cta: string | null
  mediaPrompt: string | null
  characterUsed: 'male' | 'female' | null
  platform: SocialPlatform | null
}

// ── Platform constraints ────────────────────────────────────────────────────

export interface PlatformConstraint {
  charLimit: number
  hashtagLimit: number
  videoRequired: boolean
  aspectRatio: string
  description: string
}

export const PLATFORM_CONSTRAINTS: Record<SocialPlatform, PlatformConstraint> = {
  facebook: {
    charLimit: 2200,
    hashtagLimit: 5,
    videoRequired: false,
    aspectRatio: '16:9',
    description: 'Conversational, link-friendly, community engagement',
  },
  instagram: {
    charLimit: 2200,
    hashtagLimit: 30,
    videoRequired: false,
    aspectRatio: '1:1',
    description: 'Visual-first, emoji-rich, hashtag strategy, carousel-friendly',
  },
  linkedin: {
    charLimit: 3000,
    hashtagLimit: 5,
    videoRequired: false,
    aspectRatio: '16:9',
    description: 'Professional, thought leadership, no hashtag spam',
  },
  tiktok: {
    charLimit: 150,
    hashtagLimit: 5,
    videoRequired: true,
    aspectRatio: '9:16',
    description: 'Hook in first 3 seconds, trend-aware, vertical video',
  },
  youtube: {
    charLimit: 5000,
    hashtagLimit: 15,
    videoRequired: true,
    aspectRatio: '16:9',
    description: 'Title + description + tags, searchable, thumbnail-driven',
  },
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export interface PlatformAnalytics {
  id: string
  founderId: string
  businessKey: string
  platform: string
  postExternalId: string
  socialPostId: string | null
  metricDate: string
  impressions: number
  reach: number
  engagements: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  videoViews: number
  videoWatchTimeSeconds: number
  followerDelta: number
  engagementRate: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AnalyticsSummary {
  totalImpressions: number
  totalReach: number
  totalEngagements: number
  totalClicks: number
  totalVideoViews: number
  averageEngagementRate: number
  followerGrowth: number
  topPosts: PlatformAnalytics[]
  byPlatform: Record<string, {
    impressions: number
    engagements: number
    reach: number
    engagementRate: number
    postCount: number
  }>
}
