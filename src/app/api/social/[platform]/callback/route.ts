// src/app/api/social/[platform]/callback/route.ts
// GET /api/social/[platform]/callback?code=...&state=...
// Handles OAuth callback, exchanges code for token, stores in vault

import { NextResponse } from 'next/server'
import { exchangeCode, savePlatformTokens } from '@/lib/integrations/social'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/founder/social?error=${error}&platform=${platform}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/founder/social?error=missing_params&platform=${platform}`, request.url)
    )
  }

  let stateData: { founderId: string; platform: string; nonce: string }
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(
      new URL(`/founder/social?error=invalid_state&platform=${platform}`, request.url)
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const redirectUri = `${appUrl}/api/social/${platform}/callback`

  const tokens = await exchangeCode(platform, code, redirectUri)

  if (!tokens) {
    return NextResponse.redirect(
      new URL(`/founder/social?error=token_exchange_failed&platform=${platform}`, request.url)
    )
  }

  await savePlatformTokens(stateData.founderId, platform, {
    access_token: tokens.access_token,
    ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
    ...(tokens.expires_in && { expires_at: Date.now() + tokens.expires_in * 1000 }),
  })

  return NextResponse.redirect(
    new URL(`/founder/social?connected=${platform}`, request.url)
  )
}
