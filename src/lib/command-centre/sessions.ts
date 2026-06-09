// src/lib/command-centre/sessions.ts
//
// CC-14 — Agent Session Manager (control plane). Typed accessors + a lifecycle
// state machine over cc_execution_sessions (20260604010000…phase2.sql).
//
// SAFETY / architecture: this is the CONTROL PLANE only. The web app never
// executes code in-request — it records and transitions session STATE; the
// actual work runs in an external executor (Pi-CEO-Dev / Claude Code / Codex)
// which reports back via logs_ref + status. The safety envelope (branch-only,
// sandbox, bounded file changes) is a policy invariant of those executors and a
// governance guard at the API layer (only an approved/queued task may start a
// session). Nothing here spawns a process.
//
// No remote calls at import time — the Supabase client is created lazily.
// All rows are founder-scoped by RLS (founder_id = auth.uid()).

import { createClient } from '@/lib/supabase/server'
import type { SupabaseLike } from './tasks'

// ─── Types (mirror the SQL schema) ────────────────────────────────────────────

/** cc_execution_sessions.surface CHECK. */
export type SessionSurface = 'codex' | 'claude-code' | 'pi-ceo-dev' | 'local'

/** cc_execution_sessions.status CHECK. */
export type SessionStatus = 'running' | 'paused' | 'done' | 'failed'

/** A lifecycle action a caller can request against a session. */
export type SessionAction = 'pause' | 'resume' | 'complete' | 'fail'

export interface ExecutionSession {
  id: string
  founder_id: string
  task_id: string
  surface: SessionSurface
  status: SessionStatus
  logs_ref: string | null
  started_at: string
  ended_at: string | null
}

export interface StartSessionInput {
  founderId: string
  taskId: string
  surface?: SessionSurface
  logsRef?: string | null
}

export interface ListSessionsFilter {
  founderId: string
  taskId: string
  limit?: number
}

export const CC_EXECUTION_SESSIONS_TABLE = 'cc_execution_sessions'

export const SESSION_SURFACES: readonly SessionSurface[] = ['codex', 'claude-code', 'pi-ceo-dev', 'local']
export const SESSION_ACTIONS: readonly SessionAction[] = ['pause', 'resume', 'complete', 'fail']

const TERMINAL: ReadonlySet<SessionStatus> = new Set(['done', 'failed'])

// ─── Pure state machine (unit-tested without any DB) ──────────────────────────

/** The status a successful action moves the session to. */
export function actionToStatus(action: SessionAction): SessionStatus {
  switch (action) {
    case 'pause':
      return 'paused'
    case 'resume':
      return 'running'
    case 'complete':
      return 'done'
    case 'fail':
      return 'failed'
  }
}

/**
 * Whether `action` is valid from `from`:
 *  - pause:    running → paused
 *  - resume:   paused  → running
 *  - complete: running|paused → done
 *  - fail:     running|paused → failed
 * Terminal states (done/failed) accept nothing.
 */
export function canApply(action: SessionAction, from: SessionStatus): boolean {
  if (TERMINAL.has(from)) return false
  switch (action) {
    case 'pause':
      return from === 'running'
    case 'resume':
      return from === 'paused'
    case 'complete':
    case 'fail':
      return from === 'running' || from === 'paused'
  }
}

export function isTerminal(status: SessionStatus): boolean {
  return TERMINAL.has(status)
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/** Start a session (status 'running'). The governance guard (task must be an
 *  approved/queued task) is enforced by the caller/API, not here. */
export async function startSession(
  input: StartSessionInput,
  client?: SupabaseLike,
): Promise<ExecutionSession> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const row = {
    founder_id: input.founderId,
    task_id: input.taskId,
    surface: input.surface ?? 'local',
    status: 'running' as SessionStatus,
    logs_ref: input.logsRef ?? null,
  }

  const { data, error } = await db.from(CC_EXECUTION_SESSIONS_TABLE).insert(row).select('*').single()
  if (error) throw new Error(`startSession failed: ${error.message}`)
  return data as ExecutionSession
}

/** List a task's sessions, newest first. Capped at 100 rows. */
export async function listSessionsForTask(
  filter: ListSessionsFilter,
  client?: SupabaseLike,
): Promise<ExecutionSession[]> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 100)

  const { data, error } = await db
    .from(CC_EXECUTION_SESSIONS_TABLE)
    .select('*')
    .eq('founder_id', filter.founderId)
    .eq('task_id', filter.taskId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`listSessionsForTask failed: ${error.message}`)
  return (data as ExecutionSession[]) ?? []
}

/** List a founder's most recent sessions across all tasks, newest first. Capped at 200. */
export async function listRecentSessions(
  input: { founderId: string; limit?: number },
  client?: SupabaseLike,
): Promise<ExecutionSession[]> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 200)

  const { data, error } = await db
    .from(CC_EXECUTION_SESSIONS_TABLE)
    .select('*')
    .eq('founder_id', input.founderId)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`listRecentSessions failed: ${error.message}`)
  return (data as ExecutionSession[]) ?? []
}

/** Fetch a single founder-scoped session by id, or null. */
export async function getSessionById(
  input: { founderId: string; sessionId: string },
  client?: SupabaseLike,
): Promise<ExecutionSession | null> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const { data, error } = await db
    .from(CC_EXECUTION_SESSIONS_TABLE)
    .select('*')
    .eq('founder_id', input.founderId)
    .eq('id', input.sessionId)
    .single()

  if (error) {
    if (!data) return null
    throw new Error(`getSessionById failed: ${error.message}`)
  }
  return (data as ExecutionSession) ?? null
}

/** Low-level status update (sets ended_at for terminal states). */
async function writeSessionStatus(
  input: { founderId: string; sessionId: string; status: SessionStatus; endedAt?: string | null },
  db: SupabaseLike,
): Promise<ExecutionSession | null> {
  const patch: Record<string, unknown> = { status: input.status }
  if (input.status === 'done' || input.status === 'failed') {
    patch.ended_at = input.endedAt ?? new Date().toISOString()
  }

  const { data, error } = await db
    .from(CC_EXECUTION_SESSIONS_TABLE)
    .update(patch)
    .eq('founder_id', input.founderId)
    .eq('id', input.sessionId)
    .select('*')
    .single()

  if (error) {
    if (!data) return null
    throw new Error(`updateSessionStatus failed: ${error.message}`)
  }
  return (data as ExecutionSession) ?? null
}

export type ApplyActionOutcome =
  | { ok: true; session: ExecutionSession }
  | { ok: false; reason: 'not_found' | 'invalid_transition'; from?: SessionStatus }

/**
 * Apply a lifecycle action: load the session, validate the transition against
 * the state machine, then update. Returns a discriminated outcome so the API can
 * map invalid transitions to 409 and missing sessions to 404 without throwing.
 */
export async function applySessionAction(
  input: { founderId: string; sessionId: string; action: SessionAction; endedAt?: string | null },
  client?: SupabaseLike,
): Promise<ApplyActionOutcome> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const current = await getSessionById({ founderId: input.founderId, sessionId: input.sessionId }, db)
  if (!current) return { ok: false, reason: 'not_found' }

  if (!canApply(input.action, current.status)) {
    return { ok: false, reason: 'invalid_transition', from: current.status }
  }

  const updated = await writeSessionStatus(
    { founderId: input.founderId, sessionId: input.sessionId, status: actionToStatus(input.action), endedAt: input.endedAt },
    db,
  )
  if (!updated) return { ok: false, reason: 'not_found' }
  return { ok: true, session: updated }
}
