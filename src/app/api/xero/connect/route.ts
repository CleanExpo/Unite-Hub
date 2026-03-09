// src/app/api/xero/connect/route.ts
// GET /api/xero/connect?business=<key>
// Redirects to Xero OAuth authorization URL

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? 'default'

  if (!process.env.XERO_CLIENT_ID) {
    return NextResponse.redirect(new URL('/founder/xero?error=not_configured', request.url))
  }

  const user = await getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/xero/callback`

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.XERO_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'openid profile email accounting.transactions accounting.reports.read offline_access',
    state: businessKey,
  })

  return NextResponse.redirect(
    `https://login.xero.com/identity/connect/authorize?${params.toString()}`
  )
}
