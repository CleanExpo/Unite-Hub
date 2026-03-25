// src/app/api/boardroom/meetings/[id]/notes/route.ts
// POST /api/boardroom/meetings/:id/notes — add CEO annotation

import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as { content: string }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('board_meeting_notes')
    .insert({ meeting_id: id, content: body.content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ note: data }, { status: 201 })
}
