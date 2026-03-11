// GET /api/auth/linkedin/authorize?business={key}
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SCOPES = ['w_member_social', 'r_organization_social', 'rw_organization_admin'].join(' ')

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const state = Buffer.from(JSON.stringify({ businessKey })).toString('base64url')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${APP_URL}/api/auth/linkedin/callback`,
    state,
    scope: SCOPES,
  })

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`)
}
