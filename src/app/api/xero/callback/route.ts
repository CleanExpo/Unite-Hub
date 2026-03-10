// src/app/api/xero/callback/route.ts
// Xero OAuth callback — exchanges auth code for tokens, stores in vault

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // businessKey passed via OAuth state param

  if (!code) {
    return NextResponse.redirect(new URL('/founder/xero?error=no_code', request.url))
  }

  if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/founder/xero?error=not_configured', request.url))
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    // Exchange auth code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/xero/callback`
    const credentials = Buffer.from(
      `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
    ).toString('base64')

    const tokenRes = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/founder/xero?error=token_exchange', request.url))
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
    }

    // Fetch the Xero tenant (organisation) list
    const connectionsRes = await fetch('https://api.xero.com/connections', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!connectionsRes.ok) {
      return NextResponse.redirect(new URL('/founder/xero?error=tenant_fetch', request.url))
    }

    const connections = await connectionsRes.json() as Array<{
      tenantId: string
      tenantName: string
    }>

    if (!connections.length) {
      return NextResponse.redirect(new URL('/founder/xero?error=no_tenant', request.url))
    }

    // Use first tenant (single-org setup)
    const tenant = connections[0]

    const storedTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      tenant_id: tenant.tenantId,
    }

    // Encrypt and store in vault
    const { encrypt } = await import('@/lib/vault')
    const { createServiceClient } = await import('@/lib/supabase/service')

    const payload = encrypt(JSON.stringify(storedTokens))
    const businessKey = state ?? 'default'

    const supabase = createServiceClient()
    const { error: upsertError } = await supabase.from('credentials_vault').upsert(
      {
        founder_id: user.id,
        service: 'xero',
        label: businessKey,
        encrypted_value: payload.encryptedValue,
        iv: payload.iv,
        salt: payload.salt,
        notes: tenant.tenantName,
      },
      { onConflict: 'founder_id,service,label' }
    )

    if (upsertError) {
      console.error('[Xero Callback] Vault upsert failed:', upsertError.message)
      return NextResponse.redirect(new URL('/founder/xero?error=vault_save', request.url))
    }

    return NextResponse.redirect(
      new URL(`/founder/xero?connected=true&business=${businessKey}`, request.url)
    )
  } catch {
    return NextResponse.redirect(new URL('/founder/xero?error=unknown', request.url))
  }
}
