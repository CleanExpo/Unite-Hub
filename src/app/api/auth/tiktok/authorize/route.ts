// GET /api/auth/tiktok/authorize?business={key}
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { signOAuthState } from '@/lib/oauth-state'
import { requireOAuthEnv } from '@/lib/oauth-env-guard'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  // Guard: fail loud if TikTok OAuth env vars are absent. Previously the
  // route would redirect to TikTok with client_key=undefined in the URL.
  const envCheck = requireOAuthEnv({
    check: 'tiktok_authorize',
    required: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'NEXT_PUBLIC_APP_URL'],
  })
  if (!envCheck.ok) return envCheck.response

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const state = signOAuthState({ businessKey })

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: 'user.info.basic,video.list,video.publish',
    response_type: 'code',
    redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    state,
  })

  return NextResponse.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params}`)
}
