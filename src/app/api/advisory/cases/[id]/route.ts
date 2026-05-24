// src/app/api/advisory/cases/[id]/route.ts
// GET: Case detail with proposals, scores, and evidence count

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

  // Fetch case
  const { data: caseRow, error: caseError } = await supabase
    .from('advisory_cases')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (caseError || !caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  // Fetch proposals and scores in parallel
  const [proposalsResult, scoresResult, evidenceCountResult] = await Promise.all([
    supabase
      .from('advisory_proposals')
      .select('*')
      .eq('case_id', id)
      .eq('founder_id', user.id)
      .order('round', { ascending: true })
      .order('firm_key', { ascending: true }),
    supabase
      .from('advisory_judge_scores')
      .select('*')
      .eq('case_id', id)
      .eq('founder_id', user.id),
    supabase
      .from('advisory_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', id)
      .eq('founder_id', user.id),
  ])

  return NextResponse.json({
    case: caseRow,
    proposals: proposalsResult.data ?? [],
    scores: scoresResult.data ?? [],
    evidenceCount: evidenceCountResult.count ?? 0,
  })
}
