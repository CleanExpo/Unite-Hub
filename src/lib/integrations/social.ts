// src/lib/integrations/social.ts
// Social platform integration setup — OAuth initiation, token storage, status checks
// Follows the same vault-backed pattern as Xero

import { createServiceClient } from '@/lib/supabase/service'
import { encrypt, decrypt } from '@/lib/vault'

// ── Platform Configuration ────────────────────────────────────────────────────

export interface SocialPlatform {
  key: string
  name: string
  description: string
  envVarId: string
  envVarSecret: string
  setupUrl: string
  docsUrl: string
  scope: string
  authUrl: string
  tokenUrl: string
  icon: string
  connected: boolean
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: 'meta',
    name: 'Meta',
    description: 'Facebook, Instagram, WhatsApp Business',
    envVarId: 'META_APP_ID',
    envVarSecret: 'META_APP_SECRET',
    setupUrl: 'https://developers.facebook.com/apps/',
    docsUrl: 'https://developers.facebook.com/docs/apps/',
    scope: 'pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,whatsapp_business_management',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    icon: 'M',
    connected: false,
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    description: 'Company page posts and analytics',
    envVarId: 'LINKEDIN_CLIENT_ID',
    envVarSecret: 'LINKEDIN_CLIENT_SECRET',
    setupUrl: 'https://www.linkedin.com/developers/apps/',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/',
    scope: 'r_liteprofile,r_basicprofile,r_organization_social,w_organization_social,rw_organization_admin',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    icon: 'in',
    connected: false,
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    description: 'Video uploads and analytics',
    envVarId: 'TIKTOK_CLIENT_KEY',
    envVarSecret: 'TIKTOK_CLIENT_SECRET',
    setupUrl: 'https://developers.tiktok.com/apps/',
    docsUrl: 'https://developers.tiktok.com/doc/overview/',
    scope: 'user.info.basic,video.list,video.publish',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    icon: 'TT',
    connected: false,
  },
  {
    key: 'youtube',
    name: 'YouTube',
    description: 'Video uploads and channel management',
    envVarId: 'YOUTUBE_API_KEY',
    envVarSecret: '',
    setupUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
    docsUrl: 'https://developers.google.com/youtube/v3',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
    authUrl: '',
    tokenUrl: '',
    icon: 'YT',
    connected: false,
  },
  {
    key: 'reddit',
    name: 'Reddit',
    description: 'Subreddit automation and posts',
    envVarId: 'REDDIT_CLIENT_ID',
    envVarSecret: 'REDDIT_CLIENT_SECRET',
    setupUrl: 'https://www.reddit.com/prefs/apps/',
    docsUrl: 'https://www.reddit.com/dev/api/',
    scope: 'read,submit,identity',
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    icon: 'R',
    connected: false,
  },
]

// ── Credential Checks ────────────────────────────────────────────────────────

export function isPlatformConfigured(key: string): boolean {
  const platform = SOCIAL_PLATFORMS.find(p => p.key === key)
  if (!platform) return false

  const id = process.env[platform.envVarId]
  if (!id || id.length < 5) return false

  // YouTube only needs API key
  if (key === 'youtube') return true

  const secret = process.env[platform.envVarSecret]
  return Boolean(secret && secret.length > 5)
}

export function getPlatformCredentials(key: string): { clientId: string; clientSecret: string } {
  const platform = SOCIAL_PLATFORMS.find(p => p.key === key)
  if (!platform) return { clientId: '', clientSecret: '' }

  return {
    clientId: process.env[platform.envVarId] ?? '',
    clientSecret: process.env[platform.envVarSecret] ?? '',
  }
}

// ── Connection Status ────────────────────────────────────────────────────────

export async function loadPlatformTokens(
  founderId: string,
  platformKey: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: number; connectedAt: string } | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt, created_at')
    .eq('founder_id', founderId)
    .eq('service', `social_${platformKey}`)
    .single()

  if (error || !data) return null

  try {
    const decrypted = decrypt({
      encryptedValue: data.encrypted_value,
      iv: data.iv,
      salt: data.salt,
    })
    const tokens = JSON.parse(decrypted)
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_at,
      connectedAt: data.created_at,
    }
  } catch {
    return null
  }
}

export async function savePlatformTokens(
  founderId: string,
  platformKey: string,
  tokens: { access_token: string; refresh_token?: string; expires_at?: number }
): Promise<void> {
  const supabase = createServiceClient()
  const encrypted = encrypt(JSON.stringify(tokens))

  await supabase.from('credentials_vault').upsert({
    founder_id: founderId,
    service: `social_${platformKey}`,
    key: 'oauth_tokens',
    encrypted_value: encrypted.encryptedValue,
    iv: encrypted.iv,
    salt: encrypted.salt,
  })
}

// ── OAuth URL Builders ───────────────────────────────────────────────────────

export function buildOAuthUrl(
  platformKey: string,
  redirectUri: string,
  state: string
): string {
  const platform = SOCIAL_PLATFORMS.find(p => p.key === platformKey)
  if (!platform || !platform.authUrl) return ''

  const { clientId } = getPlatformCredentials(platformKey)
  if (!clientId) return ''

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: platform.scope,
    state,
  })

  if (platformKey === 'linkedin') {
    params.set('response_type', 'code')
  } else if (platformKey === 'reddit') {
    params.set('response_type', 'code')
    params.set('duration', 'permanent')
  } else if (platformKey === 'meta') {
    params.delete('scope')
    params.set('scope', 'pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish')
  } else if (platformKey === 'tiktok') {
    params.set('response_type', 'code')
  }

  return `${platform.authUrl}?${params.toString()}`
}

// ── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeCode(
  platformKey: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
  const platform = SOCIAL_PLATFORMS.find(p => p.key === platformKey)
  if (!platform) return null

  const { clientId, clientSecret } = getPlatformCredentials(platformKey)
  if (!clientId || !clientSecret) return null

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(platform.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    console.error(`[social:${platformKey}] Token exchange failed:`, await res.text())
    return null
  }

  return res.json()
}
