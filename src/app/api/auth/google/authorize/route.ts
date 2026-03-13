// src/app/api/auth/google/authorize/route.ts
// Generates Google OAuth URL with login_hint to target a specific account
// GET /api/auth/google/authorize?email=phill@disasterrecovery.com.au

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'openid',
  'email',
  'profile',
].join(' ')

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL!.trim()}/api/auth/google/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',        // force refresh_token every time
    login_hint: email,
    state: Buffer.from(JSON.stringify({ email })).toString('base64url'),
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  )
}
