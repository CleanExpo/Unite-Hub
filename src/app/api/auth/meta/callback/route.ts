// GET /api/auth/meta/callback?code=...&state=...
// Exchanges code for token, fetches FB pages + IG accounts, stores in social_channels
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { upsertChannel } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
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
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    businessKey = decoded.businessKey
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/social?error=invalid_state`)
  }

  // Exchange code for short-lived user token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/meta/callback`,
      code,
    })
  )

  if (!tokenRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const { access_token: shortToken } = await tokenRes.json() as { access_token: string }

  // Exchange for long-lived token (60 days)
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      fb_exchange_token: shortToken,
    })
  )

  if (!longRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const { access_token: longToken, expires_in } = await longRes.json() as {
    access_token: string
    expires_in: number
  }

  const expiresAt = Date.now() + (expires_in ?? 5_184_000) * 1000 // default 60 days

  // Fetch connected Facebook Pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}&fields=id,name,username,fan_count`
  )
  const { data: pages = [] } = pagesRes.ok ? await pagesRes.json() as { data: Array<{ id: string; name: string; username?: string; fan_count?: number }> } : { data: [] }

  // Store each Facebook Page
  for (const page of pages) {
    await upsertChannel({
      founderId: user.id,
      platform: 'facebook',
      businessKey,
      channelId: page.id,
      channelName: page.name,
      handle: page.username ?? null,
      accessToken: longToken,
      expiresAt,
      metadata: { followerCount: page.fan_count ?? 0 },
    })

    // Check for linked Instagram Business Account
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${longToken}`
    )
    if (igRes.ok) {
      const igData = await igRes.json() as { instagram_business_account?: { id: string } }
      if (igData.instagram_business_account) {
        const igId = igData.instagram_business_account.id
        const igInfoRes = await fetch(
          `https://graph.facebook.com/v19.0/${igId}?fields=username,name,followers_count&access_token=${longToken}`
        )
        const igInfo = igInfoRes.ok ? await igInfoRes.json() as { username?: string; name?: string; followers_count?: number } : {}
        await upsertChannel({
          founderId: user.id,
          platform: 'instagram',
          businessKey,
          channelId: igId,
          channelName: igInfo.name ?? page.name,
          handle: igInfo.username ? `@${igInfo.username}` : null,
          accessToken: longToken,
          expiresAt,
          metadata: { pageId: page.id, followerCount: igInfo.followers_count ?? 0 },
        })
      }
    }
  }

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=meta&business=${businessKey}`)
}
