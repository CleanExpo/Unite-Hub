// src/lib/integrations/social.ts
// Social platform OAuth stubs — configured via env vars per platform

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube'

export interface SocialConnection {
  platform: SocialPlatform
  businessKey: string
  connected: boolean
  handle: string | null
  followerCount: number | null
}

const PLATFORM_ENV_KEYS: Record<SocialPlatform, string> = {
  facebook: 'FACEBOOK_APP_ID',
  instagram: 'INSTAGRAM_APP_ID',
  linkedin: 'LINKEDIN_CLIENT_ID',
  tiktok: 'TIKTOK_CLIENT_KEY',
  youtube: 'YOUTUBE_API_KEY',
}

export function isPlatformConfigured(platform: SocialPlatform): boolean {
  return Boolean(process.env[PLATFORM_ENV_KEYS[platform]])
}

export function getConnections(businessKey: string): SocialConnection[] {
  const platforms: SocialPlatform[] = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube']
  return platforms.map(platform => ({
    platform,
    businessKey,
    connected: false,
    handle: null,
    followerCount: null,
  }))
}
