// src/app/api/advisory/cases/[id]/start/route.ts
// POST: Trigger the debate engine for a case.
// The debate runs asynchronously — progress streams via Supabase Realtime.

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runDebate } from '@/lib/advisory/debate-engine'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  // Verify case exists and belongs to user
  const supabase = createServiceClient()
  const { data: caseRow, error: caseError } = await supabase
    .from('advisory_cases')
    .select('id, status, founder_id')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (caseError || !caseRow) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  if (caseRow.status !== 'draft') {
    return NextResponse.json(
      { error: `Case status is '${caseRow.status}' — only draft cases can be started` },
      { status: 409 }
    )
  }

  // Start the debate asynchronously — don't await completion.
  // The generator drives itself; we consume events and broadcast via Realtime.
  runDebateAsync(id, user.id).catch(err => {
    console.error(`[advisory/start] Unhandled debate error for case ${id}:`, err)
  })

  return NextResponse.json({ message: 'Debate started', caseId: id })
}

/**
 * Consumes the debate generator and broadcasts events via Supabase Realtime.
 * Runs in the background — not awaited by the HTTP handler.
 */
async function runDebateAsync(caseId: string, founderId: string) {
  const supabase = createServiceClient()
  const channel = supabase.channel(`advisory:${caseId}`)

  // Subscribe the channel so broadcasts work
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve()
    })
  })

  try {
    for await (const event of runDebate(caseId, founderId)) {
      // Broadcast each event to any frontend subscribers
      await channel.send({
        type: 'broadcast',
        event: 'debate_event',
        payload: event,
      })
    }
  } finally {
    supabase.removeChannel(channel)
  }
}
