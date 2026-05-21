// src/app/api/advisory/cases/[id]/review/route.ts
// POST: Accountant review — approve or reject the advisory case

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import type { AccountantReviewRequest } from '@/lib/advisory/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: AccountantReviewRequest
  try {
    body = await request.json() as AccountantReviewRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.decision || !['approved', 'rejected'].includes(body.decision)) {
    return NextResponse.json(
      { error: 'decision must be "approved" or "rejected"' },
      { status: 400 }
    )
  }

  if (!body.reviewedBy?.trim()) {
    return NextResponse.json({ error: 'reviewedBy is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify case exists and is in pending_review status
  const { data: caseRow, error: caseError } = await supabase
    .from('advisory_cases')
    .select('id, status, approval_queue_id')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (caseError || !caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  if (caseRow.status !== 'pending_review') {
    return NextResponse.json(
      { error: `Case status is '${caseRow.status}' — only pending_review cases can be reviewed` },
      { status: 409 }
    )
  }

  // Update case
  const { data: updated, error: updateError } = await supabase
    .from('advisory_cases')
    .update({
      status: body.decision,
      accountant_notes: body.notes?.trim() || null,
      reviewed_by: body.reviewedBy.trim(),
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('founder_id', user.id)
    .select('*')
    .single()

  if (updateError) {
    console.error('[advisory/review] POST failed:', updateError.message)
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }

  // Update approval_queue if linked — include founder_id for defence-in-depth
  if (caseRow.approval_queue_id) {
    await supabase
      .from('approval_queue')
      .update({ status: body.decision })
      .eq('id', caseRow.approval_queue_id)
      .eq('founder_id', user.id)
  }

  return NextResponse.json(updated)
}
