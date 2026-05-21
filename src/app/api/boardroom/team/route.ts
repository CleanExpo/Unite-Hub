// src/app/api/boardroom/team/route.ts
// GET  /api/boardroom/team — list team members (seeds AI agent on first call)
// POST /api/boardroom/team — add team member

import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seed Claude Dev Agent if no members exist
  if (!data || data.length === 0) {
    const { data: seeded, error: seedErr } = await supabase
      .from('team_members')
      .insert({
        founder_id: user.id,
        name: 'Claude Dev Agent',
        role: 'ai-agent',
        github_login: null,
        metadata: {
          description: 'AI programmer agent. Assigned tasks from the Boardroom, ships via GitHub and Linear.',
          model: 'claude-sonnet-4-5-20250929',
        },
      })
      .select()

    if (!seedErr && seeded) {
      return NextResponse.json({ members: seeded })
    }
  }

  return NextResponse.json({ members: data })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await request.json() as {
    name: string
    role: string
    email?: string
    github_login?: string
    linear_user_id?: string
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .insert({ founder_id: user.id, ...body })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data }, { status: 201 })
}
