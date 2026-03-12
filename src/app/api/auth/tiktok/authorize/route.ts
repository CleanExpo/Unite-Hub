// GET /api/auth/tiktok/authorize?business={key}
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  if (!businessKey) return NextResponse.json({ error: 'business param required' }, { status: 400 })

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
  const csrfState = createHash('sha256').update(`${user.id}:${businessKey}:${Date.now()}`).digest('hex').slice(0, 16)
  const state = Buffer.from(JSON.stringify({ businessKey, csrfState })).toString('base64url')

  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: 'user.info.basic,video.list,video.publish',
    response_type: 'code',
    redirect_uri: `${APP_URL}/api/auth/tiktok/callback`,
    state,
  })

  return NextResponse.redirect(`https://www.tiktok.com/v2/auth/authorize/?${params}`)
}
