import { encrypt, decrypt } from '@/lib/vault'
import { createServiceClient } from '@/lib/supabase/service'
import { PLATFORMS } from './types'
import type { SocialChannel, SocialConnection, SocialPlatform } from './types'

/** Store a token string as an encrypted JSON blob in social_channels column */
export function encodeToken(plaintext: string): string {
  return JSON.stringify(encrypt(plaintext))
}

/** Decode an encrypted JSON blob back to plaintext */
export function decodeToken(encoded: string): string {
  return decrypt(JSON.parse(encoded))
}

/** Load all connected social channels for a founder */
export async function getChannels(founderId: string, businessKey?: string): Promise<SocialChannel[]> {
  const supabase = createServiceClient()
  let query = supabase
    .from('social_channels')
    .select('*')
    .eq('founder_id', founderId)

  if (businessKey) {
    query = query.eq('business_key', businessKey)
  }

  const { data, error } = await query.order('platform')
  if (error) {
    console.error('[social/channels] Query failed:', error.message, error.details)
    throw error
  }

  return (data ?? []).map(row => ({
    id: row.id,
    founderId: row.founder_id,
    platform: row.platform,
    businessKey: row.business_key ?? '',
    channelId: row.channel_id,
    channelName: row.channel_name,
    handle: row.handle,
    name: row.name,
    followerCount: row.follower_count ?? 0,
    profileImageUrl: row.profile_image_url,
    isConnected: row.is_connected ?? false,
    tokenExpiresAt: row.token_expires_at,
    lastSyncedAt: row.last_synced_at,
  }))
}

/** Upsert a social channel after OAuth callback */
export async function upsertChannel(params: {
  founderId: string
  platform: string
  businessKey: string
  channelId: string
  channelName: string
  handle?: string | null
  accessToken: string
  refreshToken?: string | null
  expiresAt: number
  metadata?: Record<string, unknown>
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('social_channels').upsert(
    {
      founder_id: params.founderId,
      platform: params.platform,
      business_key: params.businessKey,
      channel_id: params.channelId,
      channel_name: params.channelName,
      handle: params.handle ?? null,
      access_token_encrypted: encodeToken(params.accessToken),
      refresh_token_encrypted: params.refreshToken ? encodeToken(params.refreshToken) : null,
      token_expires_at: new Date(params.expiresAt).toISOString(),
      is_connected: true,
      metadata: params.metadata ?? {},
    },
    { onConflict: 'founder_id,platform,channel_id' }
  )
}

/** Revoke the platform OAuth token (best-effort) and delete the channel row */
export async function deleteChannel(founderId: string, channelId: string): Promise<void> {
  const supabase = createServiceClient()

  // Fetch the row first so we can attempt token revocation
  const { data: row } = await supabase
    .from('social_channels')
    .select('platform, access_token_encrypted')
    .eq('id', channelId)
    .eq('founder_id', founderId)
    .single()

  // Best-effort token revocation — never throw, never block the delete
  if (row?.access_token_encrypted) {
    try {
      const accessToken = decodeToken(row.access_token_encrypted)
      const platform: string = row.platform

      if (platform === 'facebook' || platform === 'instagram') {
        // Meta: DELETE graph.facebook.com/me/permissions
        await fetch(
          `https://graph.facebook.com/me/permissions?access_token=${encodeURIComponent(accessToken)}`,
          { method: 'DELETE' }
        )
      } else if (platform === 'tiktok') {
        // TikTok: POST /v2/oauth/revoke/
        await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: accessToken }),
        })
      } else if (platform === 'youtube') {
        // Google/YouTube: POST oauth2.googleapis.com/revoke
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`,
          { method: 'POST' }
        )
      }
      // LinkedIn does not support programmatic token revocation — skip
    } catch {
      // Intentionally swallowed — revocation is best-effort
      console.warn('[social/channels] Token revocation failed (non-blocking) for channel:', channelId)
    }
  }

  // Delete the row — this is the authoritative operation
  const { error } = await supabase
    .from('social_channels')
    .delete()
    .eq('id', channelId)
    .eq('founder_id', founderId)

  if (error) {
    console.error('[social/channels] Delete failed:', error.message)
    throw error
  }
}

/** @deprecated Synchronous stub — returns all platforms as disconnected. Use getChannels() for real data. */
export function getConnections(businessKey: string): SocialConnection[] {
  return PLATFORMS.map((platform: SocialPlatform) => ({
    platform,
    businessKey,
    connected: false,
    handle: null,
    followerCount: null,
  }))
}
