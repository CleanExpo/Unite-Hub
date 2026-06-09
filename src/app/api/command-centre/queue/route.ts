// src/app/api/command-centre/queue/route.ts
//
// CC-10 — Queue list. GET returns the founder's command-centre tasks
// (optionally filtered by ?status= and ?projectKey=), newest first.
// Auth-gated (Supabase getUser → 401); founder-scoped by RLS.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { listTasks, type TaskStatus } from '@/lib/command-centre/tasks'

export const dynamic = 'force-dynamic'

const VALID_STATUS: readonly TaskStatus[] = [
  'proposed', 'queued', 'running', 'blocked', 'awaiting_approval', 'done', 'failed',
]

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')
  const status =
    statusParam && (VALID_STATUS as readonly string[]).includes(statusParam)
      ? (statusParam as TaskStatus)
      : undefined
  const projectKey = searchParams.get('projectKey')?.trim() || undefined

  try {
    const tasks = await listTasks({ founderId: user.id, status, projectKey, limit: 100 })
    return NextResponse.json({ tasks })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to list tasks' },
      { status: 500 },
    )
  }
}
