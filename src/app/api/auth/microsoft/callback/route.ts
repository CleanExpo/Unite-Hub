// src/app/api/auth/microsoft/callback/route.ts
// Receives Microsoft OAuth code, exchanges for tokens, encrypts, stores in credentials_vault.
// GET /api/auth/microsoft/callback?code=...&state=...

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { encrypt } from '@/lib/vault'
import { accountByEmail } from '@/lib/email-accounts'
import { verifyOAuthState } from '@/lib/oauth-state'
import {
  MICROSOFT_OAUTH_SCOPES,
  fetchMicrosoftSender,
  isMicrosoftConfigured,
} from '@/lib/integrations/microsoft-oauth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || requestUrl.origin
  const user = await getUser()
  if (!user) return NextResponse.redirect(`${appUrl}/auth/login`)

  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${appUrl}/founder/email?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/founder/email?error=missing_params`)
  }

  if (!isMicrosoftConfigured()) {
    return NextResponse.redirect(`${appUrl}/founder/email?error=microsoft_not_configured`)
  }

  let loginHintEmail = ''
  try {
    const decoded = verifyOAuthState(state)
    const expiresAt = Number(decoded.expiresAt)
    if (
      decoded.founderId !== user.id ||
      !decoded.nonce ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return NextResponse.redirect(`${appUrl}/founder/email?error=invalid_state`)
    }
    loginHintEmail = decoded.email
  } catch {
    return NextResponse.redirect(`${appUrl}/founder/email?error=invalid_state`)
  }

  if (!loginHintEmail) {
    return NextResponse.redirect(`${appUrl}/founder/email?error=invalid_state`)
  }

  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID!.trim(),
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!.trim(),
      redirect_uri: `${appUrl}/api/auth/microsoft/callback`,
      grant_type: 'authorization_code',
      scope: MICROSOFT_OAUTH_SCOPES,
    }),
  })

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error('[Microsoft OAuth] Token exchange failed:', tokenRes.status, errBody)
    return NextResponse.redirect(`${appUrl}/founder/email?error=token_exchange_failed`)
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope?: string
  }

  let sender: Awaited<ReturnType<typeof fetchMicrosoftSender>>
  try {
    sender = await fetchMicrosoftSender(tokens.access_token)
  } catch (err) {
    console.error(
      '[Microsoft OAuth] Sender lookup failed:',
      err instanceof Error ? err.message : 'unknown error',
    )
    return NextResponse.redirect(`${appUrl}/founder/email?error=sender_lookup_failed`)
  }

  const payload = encrypt(
    JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: Date.now() + tokens.expires_in * 1000,
      scope: tokens.scope ?? '',
    }),
  )

  const account = accountByEmail(sender.email)
  const businessKey = account?.businessKey ?? 'personal'
  const label = sender.displayName ?? account?.label ?? sender.email

  const supabase = createServiceClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('founder_id', user.id)
    .eq('slug', businessKey)
    .maybeSingle()

  const { error: upsertError } = await supabase.from('credentials_vault').upsert(
    {
      founder_id: user.id,
      business_id: business?.id ?? null,
      service: 'microsoft',
      label,
      encrypted_value: payload.encryptedValue,
      iv: payload.iv,
      salt: payload.salt,
      notes: sender.email,
      metadata: {
        email: sender.email,
        displayName: sender.displayName,
        businessKey,
        loginHintEmail,
      },
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: 'founder_id,service,label' },
  )

  if (upsertError) {
    console.error('[Microsoft OAuth] Vault save failed:', upsertError.message)
    return NextResponse.redirect(`${appUrl}/founder/email?error=vault_save`)
  }

  return NextResponse.redirect(
    `${appUrl}/founder/email?connected=${encodeURIComponent(sender.email)}`,
  )
}
