// src/app/api/command-centre/tasks/route.ts
//
// CC-17 — Work queue read model.
//
// GET  /api/command-centre/tasks            → the founder's cc_tasks (newest first)
// GET  /api/command-centre/tasks?status=…   → filtered to a single status
//
// Auth-gated (Supabase getUser; unauth → 401). Founder-scoped (founder_id =
// user.id). Read-only — no mutation, no execution.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { listTasks, type TaskStatus } from '@/lib/command-centre/tasks'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  'proposed',
  'queued',
  'running',
  'blocked',
  'awaiting_approval',
  'done',
  'failed',
])

function parseStatus(raw: string | null): TaskStatus | undefined {
  if (!raw) return undefined
  return VALID_STATUSES.has(raw as TaskStatus) ? (raw as TaskStatus) : undefined
}

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const url = new URL(request.url)
  const rawStatus = url.searchParams.get('status')
  // An unknown status is a 400 rather than silently returning everything.
  if (rawStatus && !parseStatus(rawStatus)) {
    return NextResponse.json({ error: `Unknown status "${rawStatus}"` }, { status: 400 })
  }
  const status = parseStatus(rawStatus)

  try {
    const tasks = await listTasks({ founderId: user.id, status, limit: 100 })
    return NextResponse.json({ tasks }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to list tasks' },
      { status: 500 },
    )
  }
}
