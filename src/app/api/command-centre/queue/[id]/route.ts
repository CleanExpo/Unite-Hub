// src/app/api/command-centre/queue/[id]/route.ts
//
// CC-10 — Single queue item.
//   GET   → the task + its approval history (404 if not found / not yours)
//   PATCH → update the task status ({ status }) + append a status_changed event
// Auth-gated (Supabase getUser → 401); founder-scoped by RLS.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getTaskById, updateTaskStatus, appendTaskEvent, type TaskStatus } from '@/lib/command-centre/tasks'
import { listApprovalsForTask } from '@/lib/command-centre/approvals'
import { getValidationSummary } from '@/lib/command-centre/validation'

export const dynamic = 'force-dynamic'

const VALID_STATUS: readonly TaskStatus[] = [
  'proposed', 'queued', 'running', 'blocked', 'awaiting_approval', 'done', 'failed',
]

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  try {
    const task = await getTaskById({ founderId: user.id, taskId: id })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    const approvals = await listApprovalsForTask({ founderId: user.id, taskId: id })
    return NextResponse.json({ task, approvals })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load task' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: { status?: unknown }
  try {
    body = (await request.json()) as { status?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const status = typeof body.status === 'string' ? body.status : ''
  if (!(VALID_STATUS as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `Field "status" must be one of: ${VALID_STATUS.join(', ')}` },
      { status: 400 },
    )
  }

  // CC-12 enforcement (no fake-green): a task may not be marked `done` while any
  // required validation gate is failing or unrun. Returns 422 with the offenders.
  if (status === 'done') {
    try {
      const summary = await getValidationSummary({ founderId: user.id, taskId: id })
      if (!summary.canComplete) {
        return NextResponse.json(
          {
            error: 'Cannot complete: required validation gates are not all passing',
            failed: summary.failed,
            pending: summary.pending,
            byGate: summary.byGate,
          },
          { status: 422 },
        )
      }
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to check validation gates' },
        { status: 500 },
      )
    }
  }

  try {
    const task = await updateTaskStatus({ founderId: user.id, taskId: id, status: status as TaskStatus })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // Audit the transition (best-effort relative to the update).
    try {
      await appendTaskEvent({
        founderId: user.id,
        taskId: id,
        type: 'status_changed',
        actor: 'founder',
        payload: { status },
      })
    } catch {
      // append is best-effort; the status change is the source of truth.
    }

    return NextResponse.json({ task })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update task' },
      { status: 500 },
    )
  }
}
