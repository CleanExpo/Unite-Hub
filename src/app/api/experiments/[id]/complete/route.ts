// src/app/api/experiments/[id]/complete/route.ts
// POST: Complete an active or paused experiment with optional winner and conclusion

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: {
    winnerVariantId?: string
    conclusion?: string
  }
  try {
    body = await request.json()
  } catch {
    // Body is optional — allow empty POST
    body = {}
  }

  const supabase = createServiceClient()

  // 1. Verify experiment exists, belongs to user, and is active or paused
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .select('id, status')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (expError || !experiment) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  if (experiment.status !== 'active' && experiment.status !== 'paused') {
    return NextResponse.json(
      { error: `Cannot complete experiment with status '${experiment.status}' — must be active or paused` },
      { status: 400 }
    )
  }

  // 2. Update experiment to completed
  const update: Record<string, unknown> = {
    status: 'completed',
    ended_at: new Date().toISOString(),
  }
  if (body.winnerVariantId) update.winner_variant_id = body.winnerVariantId
  if (body.conclusion) update.conclusion = body.conclusion

  const { data, error } = await supabase
    .from('experiments')
    .update(update)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[experiments/complete] Failed to complete experiment:', error.message)
    return NextResponse.json({ error: 'Failed to complete experiment' }, { status: 500 })
  }

  return NextResponse.json({ experiment: data })
}
