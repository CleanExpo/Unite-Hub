import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET — list skill health records (latest per skill)
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('skill_health')
    .select('*')
    .eq('founder_id', user.id)
    .order('run_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplicate: keep latest per skill_name
  const latest = new Map<string, typeof data[0]>()
  for (const row of data ?? []) {
    if (!latest.has(row.skill_name)) latest.set(row.skill_name, row)
  }

  return NextResponse.json(Array.from(latest.values()))
}

// POST — record a new eval run
export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await request.json()

  const { skill_name, eval_count, pass_count, pass_rate } = body

  if (!skill_name || eval_count == null || pass_count == null || pass_rate == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('skill_health')
    .insert({
      founder_id: user.id,
      skill_name,
      eval_count,
      pass_count,
      pass_rate,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
