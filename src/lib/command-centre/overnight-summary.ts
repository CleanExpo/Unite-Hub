// src/lib/command-centre/overnight-summary.ts
//
// CC-19 — Overnight summary / morning digest. A pure synthesis of the command
// centre's state (tasks + execution sessions) into a one-screen briefing for the
// morning, plus a gather accessor that reads the data and builds it.
//
// Read-only: no writes, no execution. The cron route persists the digest as a
// wiki daily note; the API/UI render it. No remote calls at import time.

import { listTasks, type CommandCentreTask, type TaskStatus, type SupabaseLike } from './tasks'
import { listRecentSessions, type ExecutionSession, type SessionStatus } from './sessions'

const TASK_STATUSES: readonly TaskStatus[] = [
  'proposed', 'queued', 'running', 'blocked', 'awaiting_approval', 'done', 'failed',
]
const SESSION_STATUSES: readonly SessionStatus[] = ['running', 'paused', 'done', 'failed']

export interface OvernightDigest {
  generatedAt: string
  tasks: {
    total: number
    byStatus: Record<TaskStatus, number>
    needsDecision: number // proposed + awaiting_approval
    queued: number
    blocked: number
    failed: number
    done: number
  }
  sessions: {
    total: number
    byStatus: Record<SessionStatus, number>
  }
  /** Human-readable action items, most important first. Empty ⇒ nothing needs you. */
  attention: string[]
  /** One-line summary for the top of the dashboard / the daily note title. */
  headline: string
}

function zero<T extends string>(keys: readonly T[]): Record<T, number> {
  return keys.reduce((acc, k) => { acc[k] = 0; return acc }, {} as Record<T, number>)
}

/** Pure builder — deterministic given its inputs (generatedAt is passed in). */
export function buildOvernightDigest(
  tasks: CommandCentreTask[],
  sessions: ExecutionSession[],
  generatedAt: string,
): OvernightDigest {
  const byStatus = zero(TASK_STATUSES)
  for (const t of tasks) {
    if (t.status in byStatus) byStatus[t.status] += 1
  }
  const sByStatus = zero(SESSION_STATUSES)
  for (const s of sessions) {
    if (s.status in sByStatus) sByStatus[s.status] += 1
  }

  const needsDecision = byStatus.proposed + byStatus.awaiting_approval
  const blocked = byStatus.blocked
  const failed = byStatus.failed
  const done = byStatus.done
  const queued = byStatus.queued

  const attention: string[] = []
  if (needsDecision > 0) attention.push(`${needsDecision} task${needsDecision === 1 ? '' : 's'} awaiting your decision`)
  if (blocked > 0) attention.push(`${blocked} task${blocked === 1 ? '' : 's'} blocked`)
  if (sByStatus.failed > 0) attention.push(`${sByStatus.failed} session${sByStatus.failed === 1 ? '' : 's'} failed overnight`)
  if (failed > 0) attention.push(`${failed} task${failed === 1 ? '' : 's'} failed`)
  if (sByStatus.paused > 0) attention.push(`${sByStatus.paused} session${sByStatus.paused === 1 ? '' : 's'} paused`)

  const headline =
    tasks.length === 0
      ? 'No tasks in the queue yet — capture an idea to begin.'
      : `${queued} queued · ${needsDecision} need you · ${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${done} done`

  return {
    generatedAt,
    tasks: { total: tasks.length, byStatus, needsDecision, queued, blocked, failed, done },
    sessions: { total: sessions.length, byStatus: sByStatus },
    attention,
    headline,
  }
}

/** Read founder-scoped tasks + recent sessions and build the digest. */
export async function gatherOvernightDigest(
  input: { founderId: string; generatedAt: string },
  client?: SupabaseLike,
): Promise<OvernightDigest> {
  const [tasks, sessions] = await Promise.all([
    listTasks({ founderId: input.founderId, limit: 100 }, client),
    listRecentSessions({ founderId: input.founderId, limit: 200 }, client),
  ])
  return buildOvernightDigest(tasks, sessions, input.generatedAt)
}

/** Render the digest as a markdown body for the wiki daily note. */
export function digestToMarkdown(digest: OvernightDigest): string {
  const lines: string[] = []
  lines.push(`## Morning digest`, '', digest.headline, '')
  if (digest.attention.length > 0) {
    lines.push('### Needs your attention')
    for (const a of digest.attention) lines.push(`- ${a}`)
    lines.push('')
  } else {
    lines.push('Nothing needs your attention — the board is clear.', '')
  }
  lines.push('### Tasks')
  for (const [status, n] of Object.entries(digest.tasks.byStatus)) {
    if (n > 0) lines.push(`- ${status}: ${n}`)
  }
  lines.push('', '### Sessions')
  for (const [status, n] of Object.entries(digest.sessions.byStatus)) {
    if (n > 0) lines.push(`- ${status}: ${n}`)
  }
  return lines.join('\n')
}
