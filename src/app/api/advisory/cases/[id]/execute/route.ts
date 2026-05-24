// src/app/api/advisory/cases/[id]/execute/route.ts
// POST: Execute the winning strategy after accountant approval.
// Phase 6: Posts a Xero ManualJournal (DRAFT) when Xero is connected;
//          falls back gracefully to advisory_only when it is not.

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { executeAdvisoryAction } from '@/lib/advisory/xero-bridge'
import type { FirmProposalData } from '@/lib/advisory/types'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  // Verify case is approved — also fetch financial_context for businessKey (Phase 6)
  const { data: caseRow, error: caseError } = await supabase
    .from('advisory_cases')
    .select('id, status, winning_firm, approval_queue_id, financial_context')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (caseError || !caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  if (caseRow.status !== 'approved') {
    return NextResponse.json(
      { error: `Case status is '${caseRow.status}' — only approved cases can be executed` },
      { status: 409 }
    )
  }

  if (!caseRow.winning_firm) {
    return NextResponse.json({ error: 'No winning firm — cannot execute' }, { status: 409 })
  }

  // Fetch the winning firm's final recommendation (round 5)
  const { data: winningProposal, error: proposalError } = await supabase
    .from('advisory_proposals')
    .select('*')
    .eq('case_id', id)
    .eq('founder_id', user.id)
    .eq('firm_key', caseRow.winning_firm)
    .eq('round', 5)
    .single()

  if (proposalError || !winningProposal) {
    return NextResponse.json(
      { error: 'Winning proposal not found' },
      { status: 404 }
    )
  }

  // Phase 6: Map winning strategies to a Xero ManualJournal entry.
  // executeAdvisoryAction never throws — Xero not connected returns advisory_only (200).
  const proposalData = winningProposal.structured_data as FirmProposalData
  const financialContext = caseRow.financial_context as { businessKey?: string } | null
  const businessKey: string = financialContext?.businessKey ?? 'unknown'

  const xeroResult = await executeAdvisoryAction(
    id,
    proposalData.strategies ?? [],
    businessKey,
    user.id
  )

  const { data: updated, error: updateError } = await supabase
    .from('advisory_cases')
    .update({
      status: 'executed',
      xero_entry_id: xeroResult.xeroEntryId,
    })
    .eq('id', id)
    .eq('founder_id', user.id)
    .select('*')
    .single()

  if (updateError) {
    console.error('[advisory/execute] POST failed:', updateError.message)
    return NextResponse.json({ error: 'Failed to execute case' }, { status: 500 })
  }

  // Update approval_queue if linked — include founder_id for defence-in-depth
  if (caseRow.approval_queue_id) {
    await supabase
      .from('approval_queue')
      .update({ status: 'executed' })
      .eq('id', caseRow.approval_queue_id)
      .eq('founder_id', user.id)
  }

  return NextResponse.json({
    case: updated,
    executedStrategy: winningProposal.structured_data,
    xero: {
      status: xeroResult.status,
      entryId: xeroResult.xeroEntryId,
      message: xeroResult.message,
    },
  })
}
