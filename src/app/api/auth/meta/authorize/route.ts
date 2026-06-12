// GET /api/auth/meta/authorize?business={key}
// Initiates Facebook Login OAuth — covers both Facebook Pages and Instagram Business
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { signOAuthState } from '@/lib/oauth-state'
import { requireOAuthEnv } from '@/lib/oauth-env-guard'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
].join(',')

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  // Guard: fail loud if Meta OAuth env vars are absent. Previously the route
  // would redirect to Facebook with client_id=undefined in the URL.
  const envCheck = requireOAuthEnv({
    check: 'meta_authorize',
    required: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'NEXT_PUBLIC_APP_URL'],
  })
  if (!envCheck.ok) return envCheck.response

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const state = signOAuthState({ businessKey })

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: `${APP_URL}/api/auth/meta/callback`,
    response_type: 'code',
    scope: SCOPES,
    state,
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params}`
  )
}
