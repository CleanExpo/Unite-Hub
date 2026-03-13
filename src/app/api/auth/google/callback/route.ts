// src/app/api/auth/google/callback/route.ts
// Receives Google OAuth code, exchanges for tokens, encrypts, stores in credentials_vault
// GET /api/auth/google/callback?code=...&state=...

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { encrypt } from '@/lib/vault'
import { accountByEmail } from '@/lib/email-accounts'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!.trim()
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${APP_URL}/auth/login`)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/founder/email?error=${error}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/founder/email?error=missing_params`)
  }

  // Decode state → { email }
  let email = ''
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    email = decoded.email
  } catch {
    return NextResponse.redirect(`${APP_URL}/founder/email?error=invalid_state`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error('[Google OAuth] Token exchange failed:', tokenRes.status, errBody)
    return NextResponse.redirect(`${APP_URL}/founder/email?error=token_exchange_failed`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
  }

  // Encrypt the token bundle
  const payload = encrypt(JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope,
  }))

  // Map email → business slug + label
  const account = accountByEmail(email)
  const businessKey = account?.businessKey ?? 'personal'
  const label = account?.label ?? email

  // Look up business_id (nullable — personal accounts have no business row)
  const supabase = createServiceClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('founder_id', user.id)
    .eq('slug', businessKey)
    .maybeSingle()

  // Upsert into credentials_vault (unique on founder_id, service, label)
  await supabase.from('credentials_vault').upsert(
    {
      founder_id: user.id,
      business_id: business?.id ?? null,
      service: 'google',
      label,
      encrypted_value: payload.encryptedValue,
      iv: payload.iv,
      salt: payload.salt,
      notes: email,
      metadata: { email, businessKey },
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: 'founder_id,service,label' }
  )

  return NextResponse.redirect(
    `${APP_URL}/founder/email?connected=${encodeURIComponent(email)}`
  )
}
