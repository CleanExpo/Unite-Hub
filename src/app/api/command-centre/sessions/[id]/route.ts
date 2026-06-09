// src/app/api/command-centre/sessions/[id]/route.ts
//
// CC-14 — Session lifecycle transitions.
//   PATCH { action: 'pause'|'resume'|'complete'|'fail' } → applySessionAction
//     200 { session }            on success
//     404                        session not found / not yours
//     409 { from }               invalid transition for the current status
// Auth-gated (getUser → 401); founder-scoped by RLS.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { applySessionAction, SESSION_ACTIONS, type SessionAction } from '@/lib/command-centre/sessions'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: { action?: unknown }
  try {
    body = (await request.json()) as { action?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : ''
  if (!(SESSION_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json(
      { error: `Field "action" must be one of: ${SESSION_ACTIONS.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    const outcome = await applySessionAction({ founderId: user.id, sessionId: id, action: action as SessionAction })
    if (!outcome.ok) {
      if (outcome.reason === 'not_found') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: `Invalid transition: cannot "${action}" a session in status "${outcome.from}"`, from: outcome.from },
        { status: 409 },
      )
    }
    return NextResponse.json({ session: outcome.session })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update session' },
      { status: 500 },
    )
  }
}
