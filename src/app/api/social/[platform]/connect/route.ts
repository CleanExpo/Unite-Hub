// src/app/api/social/[platform]/connect/route.ts
// OAuth redirect stub — per-platform OAuth implemented once credentials are configured
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { platform } = await params
  // TODO: Implement per-platform OAuth when credentials are configured
  return NextResponse.redirect(
    new URL(`/founder/social?platform=${platform}&status=pending`, request.url)
  )
}
