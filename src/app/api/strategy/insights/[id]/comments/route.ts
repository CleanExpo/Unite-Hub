// src/app/api/strategy/insights/[id]/comments/route.ts
// GET  /api/strategy/insights/:id/comments
// POST /api/strategy/insights/:id/comments

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('strategy_insight_comments')
    .select('*')
    .eq('insight_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as { content: string; author?: 'founder' | 'ai' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('strategy_insight_comments')
    .insert({
      insight_id: id,
      author: body.author ?? 'founder',
      content: body.content,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data }, { status: 201 })
}
