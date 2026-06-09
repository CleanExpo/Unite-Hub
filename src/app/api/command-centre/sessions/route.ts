// src/app/api/command-centre/sessions/route.ts
//
// CC-14 — Agent execution sessions (control plane).
//   POST { taskId, surface?, logsRef? } → start a session for an APPROVED task
//   GET  ?taskId=…                       → list a task's sessions
//
// Governance guard: a session may only be started for a task whose status is
// `queued` (i.e. it has passed the Board + approval). Proposed/blocked/failed/
// done tasks cannot be executed. The web app does NOT run anything — it records
// session state; the external executor reports back via PATCH + logs_ref.
// Auth-gated (getUser → 401); founder-scoped by RLS.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/command-centre/tasks'
import { startSession, listSessionsForTask, SESSION_SURFACES, type SessionSurface } from '@/lib/command-centre/sessions'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const taskId = new URL(request.url).searchParams.get('taskId')?.trim()
  if (!taskId) return NextResponse.json({ error: 'Query "taskId" is required' }, { status: 400 })

  try {
    const sessions = await listSessionsForTask({ founderId: user.id, taskId })
    return NextResponse.json({ sessions })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to list sessions' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: { taskId?: unknown; surface?: unknown; logsRef?: unknown }
  try {
    body = (await request.json()) as { taskId?: unknown; surface?: unknown; logsRef?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : ''
  if (!taskId) return NextResponse.json({ error: 'Field "taskId" is required' }, { status: 400 })

  let surface: SessionSurface = 'local'
  if (typeof body.surface === 'string') {
    if (!(SESSION_SURFACES as readonly string[]).includes(body.surface)) {
      return NextResponse.json(
        { error: `Field "surface" must be one of: ${SESSION_SURFACES.join(', ')}` },
        { status: 400 },
      )
    }
    surface = body.surface as SessionSurface
  }
  const logsRef = typeof body.logsRef === 'string' && body.logsRef.trim().length > 0 ? body.logsRef.trim() : null

  // Governance guard: only an approved/queued task may start an execution session.
  let task
  try {
    task = await getTaskById({ founderId: user.id, taskId })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load task' },
      { status: 500 },
    )
  }
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (task.status !== 'queued') {
    return NextResponse.json(
      { error: `Cannot start a session: task status is "${task.status}" (must be "queued" / approved)` },
      { status: 409 },
    )
  }

  try {
    const session = await startSession({ founderId: user.id, taskId, surface, logsRef })
    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to start session' },
      { status: 500 },
    )
  }
}
