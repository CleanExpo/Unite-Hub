export const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'] as const
export type SocialPlatform = typeof PLATFORMS[number]

export interface SocialChannel {
  id: string
  founderId: string
  platform: SocialPlatform
  businessKey: string
  channelId: string
  channelName: string | null
  handle: string | null
  name: string | null
  followerCount: number
  profileImageUrl: string | null
  isConnected: boolean
  tokenExpiresAt: string | null
  lastSyncedAt: string | null
}

export interface SocialPost {
  id: string
  founderId: string
  businessKey: string
  title: string | null
  content: string
  mediaUrls: string[]
  platforms: SocialPlatform[]
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  scheduledAt: string | null
  publishedAt: string | null
  platformPostIds: Record<string, string>
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

/** @deprecated Use SocialChannel instead — kept for backwards compat with social page */
export interface SocialConnection {
  platform: SocialPlatform
  businessKey: string
  connected: boolean
  handle: string | null
  followerCount: number | null
}

export interface CreatePostInput {
  businessKey: string
  title?: string
  content: string
  mediaUrls?: string[]
  platforms: SocialPlatform[]
  scheduledAt?: string | null
}
