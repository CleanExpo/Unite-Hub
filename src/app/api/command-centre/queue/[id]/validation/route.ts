// src/app/api/command-centre/queue/[id]/validation/route.ts
//
// CC-12 — Validation gate reporting.
//   GET  → { runs, summary }   the task's validation history + no-fake-green summary
//   POST → { run, summary }    record ONE reported gate result { gate, command?, result }
//
// The web app records results REPORTED to it (by the execution layer / CI); it
// does not execute commands itself. Completion gating (a task can't be `done`
// with a non-passing required gate) is enforced in the queue PATCH route.
// Auth-gated (getUser → 401); founder-scoped by RLS; 404 if the task isn't yours.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getTaskById } from '@/lib/command-centre/tasks'
import {
  recordValidationRun,
  listValidationRuns,
  summariseValidation,
  type GateResult,
} from '@/lib/command-centre/validation'

export const dynamic = 'force-dynamic'

const VALID_RESULTS: readonly GateResult[] = ['pass', 'fail', 'skip']

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  try {
    const task = await getTaskById({ founderId: user.id, taskId: id })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const runs = await listValidationRuns({ founderId: user.id, taskId: id })
    return NextResponse.json({ runs, summary: summariseValidation(runs) })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load validation' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: { gate?: unknown; command?: unknown; result?: unknown }
  try {
    body = (await request.json()) as { gate?: unknown; command?: unknown; result?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const gate = typeof body.gate === 'string' ? body.gate.trim() : ''
  if (!gate) return NextResponse.json({ error: 'Field "gate" is required' }, { status: 400 })

  const result = typeof body.result === 'string' ? body.result : ''
  if (!(VALID_RESULTS as readonly string[]).includes(result)) {
    return NextResponse.json(
      { error: `Field "result" must be one of: ${VALID_RESULTS.join(', ')}` },
      { status: 400 },
    )
  }
  const command = typeof body.command === 'string' && body.command.trim().length > 0 ? body.command.trim() : null

  // Confirm task ownership before recording anything.
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
    const run = await recordValidationRun({
      founderId: user.id,
      taskId: id,
      gate,
      command,
      result: result as GateResult,
    })
    const runs = await listValidationRuns({ founderId: user.id, taskId: id })
    return NextResponse.json({ run, summary: summariseValidation(runs) }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to record validation' },
      { status: 500 },
    )
  }
}
