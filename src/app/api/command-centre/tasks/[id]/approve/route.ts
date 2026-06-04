// src/app/api/command-centre/tasks/[id]/approve/route.ts
//
// CC-17 — Human approval gate.
//
// POST /api/command-centre/tasks/{id}/approve  { decision, note? }
//   decision ∈ approve | reject | edit | defer
//   → records a cc_approvals row + a cc_task_events event
//   → transitions the task status (approve→queued, reject→blocked, defer→proposed)
//   → returns the updated task
//
// Auth-gated (Supabase getUser; unauth → 401). Founder-scoped (founder_id =
// user.id). The task is verified to belong to the founder before mutation.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/command-centre/tasks'
import {
  recordApproval,
  type ApprovalDecision,
} from '@/lib/command-centre/approvals'

export const dynamic = 'force-dynamic'

const VALID_DECISIONS: ReadonlySet<ApprovalDecision> = new Set<ApprovalDecision>([
  'approve',
  'reject',
  'edit',
  'defer',
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const taskId = typeof id === 'string' ? id.trim() : ''
  if (!taskId) return NextResponse.json({ error: 'Missing task id' }, { status: 400 })

  let body: { decision?: unknown; note?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const decision = typeof body.decision === 'string' ? (body.decision.trim() as ApprovalDecision) : null
  if (!decision || !VALID_DECISIONS.has(decision)) {
    return NextResponse.json(
      { error: 'Field "decision" must be one of: approve, reject, edit, defer' },
      { status: 400 },
    )
  }
  const note =
    typeof body.note === 'string' && body.note.trim().length > 0 ? body.note.trim() : null

  // Verify ownership before mutating.
  let existing
  try {
    existing = await getTaskById({ founderId: user.id, taskId })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load task' },
      { status: 500 },
    )
  }
  if (!existing) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  try {
    const { approval, task } = await recordApproval({
      founderId: user.id,
      taskId,
      decision,
      note,
    })
    return NextResponse.json({ approval, task: task ?? existing }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record approval' },
      { status: 500 },
    )
  }
}
