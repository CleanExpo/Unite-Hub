// GET /api/auth/tiktok/callback?code=...&state=...
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { upsertChannel } from '@/lib/integrations/social/channels'
import { verifyOAuthState } from '@/lib/oauth-state'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/auth/login`)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${APP_URL}/founder/social?error=${encodeURIComponent(error)}`)
  if (!code || !state) return NextResponse.redirect(`${APP_URL}/founder/social?error=missing_params`)

  let businessKey = ''
  try {
    businessKey = verifyOAuthState(state).businessKey
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/social?error=invalid_state`)
  }

  // Exchange code for token
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const tokenData = await tokenRes.json() as {
    data?: {
      access_token: string
      refresh_token: string
      expires_in: number
      open_id: string
    }
    error?: { code: string; message: string }
  }

  if (!tokenData.data) return NextResponse.redirect(`${APP_URL}/founder/social?error=tiktok_token_error`)

  const { access_token, refresh_token, expires_in, open_id } = tokenData.data
  const expiresAt = Date.now() + expires_in * 1000

  // Fetch user info
  const infoRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url,follower_count',
    { headers: { Authorization: `Bearer ${access_token}` } }
  )
  const infoData = infoRes.ok
    ? await infoRes.json() as { data?: { user?: { display_name?: string; username?: string; follower_count?: number } } }
    : { data: undefined }
  const userInfo = infoData.data?.user ?? {}

  await upsertChannel({
    founderId: user.id,
    platform: 'tiktok',
    businessKey,
    channelId: open_id,
    channelName: userInfo.display_name ?? 'TikTok Account',
    handle: userInfo.username ? `@${userInfo.username}` : null,
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt,
    metadata: { followerCount: userInfo.follower_count ?? 0 },
  })

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=tiktok&business=${businessKey}`)
}
