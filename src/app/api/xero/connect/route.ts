// src/app/api/xero/connect/route.ts
// GET /api/xero/connect?business=<key>
// Redirects to Xero OAuth authorization URL.
// Requires an authenticated session. If the user has TOTP enrolled,
// also requires AAL2 (verified via MFAGate before reaching this route).

import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { getXeroCredentials } from '@/lib/integrations/xero'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? 'default'

  const { clientId } = getXeroCredentials(businessKey)
  if (!clientId) {
    return NextResponse.redirect(new URL('/founder/xero?error=not_configured', request.url))
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Defence-in-depth: if the user has TOTP enrolled, enforce AAL2
  // (ensures the MFA gate was actually completed, not bypassed via direct URL)
  const supabase = await createClient()
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const hasVerifiedTOTP = (factors?.totp ?? []).some(f => f.status === 'verified')

  if (hasVerifiedTOTP) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.currentLevel !== 'aal2') {
      console.warn('[xero/connect] AAL2 required but current level is', aal?.currentLevel)
      return NextResponse.redirect(
        new URL('/founder/xero?error=mfa_required', request.url)
      )
    }
  }

  // .trim() guards against accidental trailing newlines in the env var
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim()
  const redirectUri = `${appUrl}/api/xero/callback`

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope:
      'openid profile email accounting.transactions accounting.reports.read accounting.contacts.read offline_access',
    state: businessKey,
  })

  return NextResponse.redirect(
    `https://login.xero.com/identity/connect/authorize?${params.toString()}`
  )
}
