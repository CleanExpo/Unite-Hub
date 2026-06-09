// src/app/api/command-centre/queue/[id]/approve/route.ts
//
// CC-11 — Approvals lane. POST a decision against a queue task:
//   { decision: 'approve'|'reject'|'edit'|'defer', note?: string }
//     → records the decision in cc_approvals,
//     → transitions the task (approve→queued, reject→failed, defer→blocked; edit→no change),
//     → appends an immutable 'approved' audit event.
// Auth-gated (Supabase getUser → 401); founder-scoped by RLS. 404 if the task
// isn't the founder's.
//
// Note: lives under queue/ (not tasks/) because the repo .gitignore ignores any
// `tasks/` directory (Claude task state).

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/command-centre/tasks'
import { applyApproval, type ApprovalDecision } from '@/lib/command-centre/approvals'

export const dynamic = 'force-dynamic'

const VALID_DECISIONS: readonly ApprovalDecision[] = ['approve', 'reject', 'edit', 'defer']

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: { decision?: unknown; note?: unknown }
  try {
    body = (await request.json()) as { decision?: unknown; note?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const decision = typeof body.decision === 'string' ? body.decision : ''
  if (!(VALID_DECISIONS as readonly string[]).includes(decision)) {
    return NextResponse.json(
      { error: `Field "decision" must be one of: ${VALID_DECISIONS.join(', ')}` },
      { status: 400 },
    )
  }
  const note = typeof body.note === 'string' && body.note.trim().length > 0 ? body.note.trim() : null

  // Ensure the task exists and belongs to this founder before recording anything.
  let task
  try {
    task = await getTaskById({ founderId: user.id, taskId: id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load task' },
      { status: 500 },
    )
  }
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  try {
    const result = await applyApproval({
      founderId: user.id,
      taskId: id,
      decision: decision as ApprovalDecision,
      approver: 'founder',
      note,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to apply approval' },
      { status: 500 },
    )
  }
}
