// GET /api/auth/youtube/callback?code=...&state=...
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { upsertChannel } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!.trim()
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/auth/login`)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return NextResponse.redirect(`${APP_URL}/founder/social?error=${error}`)
  if (!code || !state) return NextResponse.redirect(`${APP_URL}/founder/social?error=missing_params`)

  let businessKey = ''
  try {
    businessKey = JSON.parse(Buffer.from(state, 'base64url').toString()).businessKey
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/social?error=invalid_state`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: `${APP_URL}/api/auth/youtube/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error('[YouTube OAuth] Token exchange failed:', tokenRes.status, errBody)
    return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  }
  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const expiresAt = Date.now() + tokens.expires_in * 1000

  // Fetch YouTube channel info
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )
  const channelData = channelRes.ok
    ? await channelRes.json() as { items?: Array<{ id: string; snippet: { title: string; customUrl?: string }; statistics?: { subscriberCount?: string } }> }
    : { items: [] }

  const channel = channelData.items?.[0]
  if (!channel) return NextResponse.redirect(`${APP_URL}/founder/social?error=no_youtube_channel`)

  await upsertChannel({
    founderId: user.id,
    platform: 'youtube',
    businessKey,
    channelId: channel.id,
    channelName: channel.snippet.title,
    handle: channel.snippet.customUrl ?? null,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt,
    metadata: { subscriberCount: parseInt(channel.statistics?.subscriberCount ?? '0', 10) },
  })

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=youtube&business=${businessKey}`)
}
