// src/app/api/advisory/cases/[id]/scores/route.ts
// GET: Judge scores for a case

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  // Fetch scores and case winner in parallel
  const [scoresResult, caseResult] = await Promise.all([
    supabase
      .from('advisory_judge_scores')
      .select('*')
      .eq('case_id', id)
      .eq('founder_id', user.id)
      .order('weighted_total', { ascending: false }),
    supabase
      .from('advisory_cases')
      .select('winning_firm')
      .eq('id', id)
      .eq('founder_id', user.id)
      .single(),
  ])

  if (scoresResult.error) {
    console.error('[advisory/scores] GET failed:', scoresResult.error.message)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }

  return NextResponse.json({
    scores: scoresResult.data ?? [],
    winner: caseResult.data?.winning_firm ?? null,
  })
}
