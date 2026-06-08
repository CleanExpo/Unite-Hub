// src/app/api/auth/microsoft/authorize/route.ts
// Generates Microsoft OAuth URL with login_hint to target a specific account.
// GET /api/auth/microsoft/authorize?email=phill@disasterrecovery.com.au

import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getUser } from '@/lib/supabase/server'
import { signOAuthState } from '@/lib/oauth-state'
import {
  MICROSOFT_OAUTH_SCOPES,
  isMicrosoftConfigured,
} from '@/lib/integrations/microsoft-oauth'

export const dynamic = 'force-dynamic'

const MICROSOFT_OAUTH_STATE_TTL_MS = 10 * 60 * 1000

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || requestUrl.origin
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = requestUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

  if (!isMicrosoftConfigured()) {
    return NextResponse.json(
      {
        error:
          'Microsoft OAuth is not configured on this deployment. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in Vercel (not placeholder values).',
      },
      { status: 503 },
    )
  }

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!.trim(),
    redirect_uri: `${appUrl}/api/auth/microsoft/callback`,
    response_type: 'code',
    response_mode: 'query',
    scope: MICROSOFT_OAUTH_SCOPES,
    prompt: 'consent',
    login_hint: email,
    state: signOAuthState({
      email,
      founderId: user.id,
      nonce: randomBytes(16).toString('base64url'),
      expiresAt: String(Date.now() + MICROSOFT_OAUTH_STATE_TTL_MS),
    }),
  })

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`,
  )
}
