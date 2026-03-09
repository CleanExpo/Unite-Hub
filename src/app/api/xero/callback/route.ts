// src/app/api/xero/callback/route.ts
// OAuth callback handler — stub until XERO_CLIENT_ID/SECRET are configured

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // Suppress unused variable warning until token exchange is implemented
  void state

  if (!code) {
    return NextResponse.redirect(new URL('/founder/xero?error=no_code', request.url))
  }

  // TODO: Exchange code for tokens when XERO_CLIENT_ID/SECRET are configured
  // Steps when ready:
  //   1. POST to https://identity.xero.com/connect/token with code + client credentials
  //   2. Store access_token + refresh_token in Supabase (credentials_vault table)
  //   3. Fetch tenant/organisation list from Xero Connections API
  //   4. Redirect to /founder/xero?connected=true
  return NextResponse.redirect(new URL('/founder/xero?connected=pending', request.url))
}
