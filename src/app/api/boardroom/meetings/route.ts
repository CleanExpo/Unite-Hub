// src/app/api/boardroom/meetings/route.ts
// GET /api/boardroom/meetings?limit=30&status=new

import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 90)
  const status = url.searchParams.get('status')

  const supabase = await createClient()
  let query = supabase
    .from('board_meetings')
    .select('id, meeting_date, status, agenda, brief_md, metrics, created_at')
    .order('meeting_date', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ meetings: data })
}
