// src/app/api/command-centre/board/route.ts
//
// CC-08 (+ CC-09 wiring) — Senior Board review of an idea/task.
//
// POST { taskId: string, projectKey?: string }  — review an existing idea task
//   or
// POST { subject: string, brief: string, projectKey?: string } — ad-hoc review
//
//   → runs the 9-persona Senior Board (runBoardReview, model at runtime)
//   → persists the verdict via createDecision (cc_decisions, linked to the task)
//   → appends 'approved' | 'blocked' | 'comment' task event
//   → writes a decision evidence note to the wiki
//   → on APPROVED with a taskId: decomposes the idea into N proposed sub-tasks
//
// Auth-gated (Supabase getUser; unauth → 401). Founder-scoped. The board GATES
// promotion — nothing is executed here; sub-tasks are created as `proposed`.

import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import {
  appendTaskEvent,
  addEvidenceRecord,
  CC_TASKS_TABLE,
  type CommandCentreTask,
  type SupabaseLike,
} from '@/lib/command-centre/tasks'
import { createDecision } from '@/lib/command-centre/decisions'
import { runBoardReview, verdictToEventType } from '@/lib/command-centre/board-review'
import { decomposeApprovedIdea } from '@/lib/command-centre/decompose'
import { writeEvidence } from '@/lib/obsidian/evidence'

export const dynamic = 'force-dynamic'

async function fetchTask(
  db: SupabaseLike,
  founderId: string,
  taskId: string,
): Promise<CommandCentreTask | null> {
  // tasks.ts has no single-id getter; read directly with the founder-scoped client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = db.from(CC_TASKS_TABLE).select('*')
  const { data, error } = await q.eq('founder_id', founderId).eq('id', taskId).single()
  if (error || !data) return null
  return data as CommandCentreTask
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: { taskId?: unknown; subject?: unknown; brief?: unknown; projectKey?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const taskId = typeof body.taskId === 'string' && body.taskId.trim() ? body.taskId.trim() : null
  let subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  let brief = typeof body.brief === 'string' ? body.brief.trim() : ''
  let projectKey =
    typeof body.projectKey === 'string' && body.projectKey.trim() ? body.projectKey.trim() : null

  const supabase = (await createClient()) as unknown as SupabaseLike

  // Resolve subject/brief from the task when a taskId is supplied.
  let task: CommandCentreTask | null = null
  if (taskId) {
    task = await fetchTask(supabase, user.id, taskId)
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    subject = subject || task.title
    brief = brief || task.objective
    projectKey = projectKey ?? task.project_key
  }

  if (!subject || !brief) {
    return NextResponse.json(
      { error: 'Provide either { taskId } or { subject, brief }' },
      { status: 400 },
    )
  }

  // 1. Run the 9-persona board (single model call at runtime).
  let board
  try {
    board = await runBoardReview({
      subject,
      brief,
      projectKey: projectKey ?? undefined,
      riskLevel: task?.risk_level,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Board review failed' },
      { status: 502 },
    )
  }

  // 2. Write the decision evidence note (best-effort).
  let wikiPath: string | null = null
  try {
    const result = await writeEvidence({
      project: projectKey ?? 'platform',
      taskId: taskId ?? subject,
      kind: 'decision',
      frontmatter: {
        title: `Board decision — ${subject}`,
        type: 'decision',
        tags: ['command-center', 'board', 'decision', 'cc-08'],
        confidence: 'high',
        verdict: board.verdict,
      },
      body: [
        `## Verdict: ${board.verdict}`, '',
        `## Rationale`, '', board.rationale || '(none)', '',
        `## Persona deliberation`, '',
        ...board.personas.map((p) => `- **${p.persona}** — ${p.stance}: ${p.comment}`),
      ].join('\n'),
      sources: projectKey ? [`project:${projectKey}`] : [],
    })
    wikiPath = result.relativePath
  } catch {
    wikiPath = null
  }

  // 3. Persist the decision (linked to the task when present).
  let decision
  try {
    decision = await createDecision({
      founderId: user.id,
      taskId,
      subject,
      verdict: board.verdict,
      rationale: board.rationale,
      personas: board.personas,
      wikiPath,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to persist decision' },
      { status: 500 },
    )
  }

  // 4. Append the gated task event + evidence record (best-effort).
  if (taskId) {
    try {
      await appendTaskEvent({
        founderId: user.id,
        taskId,
        type: verdictToEventType(board.verdict),
        actor: 'senior-board',
        payload: { decision_id: decision.id, verdict: board.verdict },
      })
      if (wikiPath) {
        await addEvidenceRecord({
          founderId: user.id,
          taskId,
          kind: 'decision',
          wikiPath,
          confidence: 'high',
        })
      }
    } catch {
      // Best-effort relative to returning the decision.
    }
  }

  // 5. On APPROVED with a task: generate the queue (CC-09).
  let subtasks: CommandCentreTask[] = []
  if (board.verdict === 'APPROVED' && task) {
    try {
      subtasks = await decomposeApprovedIdea({
        founderId: user.id,
        idea: task.objective || subject,
        parentTaskId: task.id,
        decisionId: decision.id,
        projectKey: task.project_key,
        projectId: task.project_id,
      })
    } catch {
      subtasks = []
    }
  }

  return NextResponse.json(
    { decision, verdict: board.verdict, personas: board.personas, subtasks },
    { status: 201 },
  )
}
