// GET /api/auth/linkedin/callback?code=...&state=...
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
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${APP_URL}/api/auth/linkedin/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(`${APP_URL}/founder/social?error=token_exchange_failed`)
  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    refresh_token_expires_in?: number
  }

  const expiresAt = Date.now() + tokens.expires_in * 1000

  // Fetch LinkedIn profile (member info)
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = profileRes.ok ? await profileRes.json() as { sub: string; name?: string; picture?: string } : { sub: 'unknown' }

  // Fetch organisation pages the user admins
  const orgsRes = await fetch(
    'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(organization~(id,localizedName,logoV2(original~:playableStreams))))',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )

  const orgsData = orgsRes.ok
    ? await orgsRes.json() as { elements?: Array<{ 'organization~': { id: number; localizedName: string } }> }
    : { elements: [] }

  const orgs = orgsData.elements ?? []

  if (orgs.length > 0) {
    for (const org of orgs) {
      const orgInfo = org['organization~']
      await upsertChannel({
        founderId: user.id,
        platform: 'linkedin',
        businessKey,
        channelId: String(orgInfo.id),
        channelName: orgInfo.localizedName,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
      })
    }
  } else {
    // No org pages — store personal profile as the channel
    await upsertChannel({
      founderId: user.id,
      platform: 'linkedin',
      businessKey,
      channelId: profile.sub,
      channelName: profile.name ?? 'LinkedIn Profile',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
    })
  }

  return NextResponse.redirect(`${APP_URL}/founder/social?connected=linkedin&business=${businessKey}`)
}
