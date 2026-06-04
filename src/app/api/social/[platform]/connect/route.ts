// src/app/api/social/[platform]/connect/route.ts
// GET /api/social/[platform]/connect
// Redirects to social platform OAuth authorization URL

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { buildOAuthUrl } from '@/lib/integrations/social'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const user = await getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const redirectUri = `${appUrl}/api/social/${platform}/callback`

  const state = Buffer.from(JSON.stringify({
    founderId: user.id,
    platform,
    nonce: crypto.randomUUID(),
  })).toString('base64url')

  const authUrl = buildOAuthUrl(platform, redirectUri, state)

  if (!authUrl) {
    return NextResponse.redirect(
      new URL(`/founder/social?error=not_configured&platform=${platform}`, request.url)
    )
  }

  return NextResponse.redirect(authUrl)
}
