// src/app/api/boardroom/meetings/[id]/route.ts
// GET  /api/boardroom/meetings/:id  — full meeting + notes
// PATCH /api/boardroom/meetings/:id — update status

import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  const [meetingRes, notesRes] = await Promise.all([
    supabase.from('board_meetings').select('*').eq('id', id).single(),
    supabase
      .from('board_meeting_notes')
      .select('*')
      .eq('meeting_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (meetingRes.error) return NextResponse.json({ error: meetingRes.error.message }, { status: 404 })
  return NextResponse.json({ meeting: meetingRes.data, notes: notesRes.data ?? [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as { status?: string }
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('board_meetings')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meeting: data })
}
