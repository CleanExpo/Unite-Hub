// src/lib/command-centre/tasks.ts
//
// Hand-written types + typed accessors for the Nexus Command Centre task
// schema (CC-03). Backed by the cc_tasks / cc_task_events / cc_evidence_records
// tables created in 20260604000000_cc_command_centre.sql.
//
// No remote calls are made at import time — the Supabase server client is
// created lazily inside each accessor (matching the repo's API-route pattern).
// All rows are founder-scoped by RLS (founder_id = auth.uid()).

import { createClient } from '@/lib/supabase/server'

// ─── Types (hand-written; mirror the SQL schema) ──────────────────────────────

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

export type TaskStatus =
  | 'proposed'
  | 'queued'
  | 'running'
  | 'blocked'
  | 'awaiting_approval'
  | 'done'
  | 'failed'

export type TaskRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type TaskExecutionMode = 'advisory' | 'local-code' | 'branch-preview' | 'overnight'

export type TaskOrigin = 'idea' | 'board-review' | 'blocker' | 'self-improvement'

export type TaskEventType =
  | 'created'
  | 'status_changed'
  | 'approved'
  | 'blocked'
  | 'started'
  | 'completed'
  | 'failed'
  | 'evidence_added'
  | 'comment'
  | 'linear_synced'

export type EvidenceKind = 'brief' | 'research' | 'decision' | 'validation' | 'handoff' | 'daily'

export type EvidenceConfidence = 'high' | 'medium' | 'low'

/** A durable Command Centre task row (cc_tasks). */
export interface CommandCentreTask {
  id: string
  founder_id: string
  external_ref: string | null
  queue_id: string | null
  project_id: string | null
  project_key: string | null
  title: string
  objective: string
  priority: TaskPriority
  status: TaskStatus
  agent_owner: string | null
  risk_level: TaskRiskLevel
  execution_mode: TaskExecutionMode
  origin: TaskOrigin
  dependencies: string[]
  human_approval_required: boolean
  evidence_path: string | null
  validation_required: string[]
  linear_id: string | null
  preview_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** An append-only audit event (cc_task_events). */
export interface TaskEvent {
  id: string
  founder_id: string
  task_id: string
  type: TaskEventType
  actor: string
  payload: Record<string, unknown>
  at: string
}

/** An evidence note linked to a task (cc_evidence_records). */
export interface EvidenceRecord {
  id: string
  founder_id: string
  task_id: string
  kind: EvidenceKind
  wiki_path: string
  sources: unknown[]
  confidence: EvidenceConfidence
  created_at: string
}

// ─── Insert input shapes (founder_id is supplied by the accessor) ─────────────

export interface CreateTaskInput {
  founderId: string
  title: string
  objective?: string
  externalRef?: string | null
  queueId?: string | null
  projectId?: string | null
  projectKey?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  agentOwner?: string | null
  riskLevel?: TaskRiskLevel
  executionMode?: TaskExecutionMode
  origin?: TaskOrigin
  dependencies?: string[]
  humanApprovalRequired?: boolean
  evidencePath?: string | null
  validationRequired?: string[]
  linearId?: string | null
  previewUrl?: string | null
  metadata?: Record<string, unknown>
}

export interface AppendTaskEventInput {
  founderId: string
  taskId: string
  type: TaskEventType
  actor?: string
  payload?: Record<string, unknown>
}

export interface AddEvidenceRecordInput {
  founderId: string
  taskId: string
  kind?: EvidenceKind
  wikiPath: string
  sources?: unknown[]
  confidence?: EvidenceConfidence
}

export interface ListTasksFilter {
  founderId: string
  status?: TaskStatus
  projectKey?: string
  limit?: number
}

// Table name constants — single source of truth, asserted by tests.
export const CC_TASKS_TABLE = 'cc_tasks'
export const CC_TASK_EVENTS_TABLE = 'cc_task_events'
export const CC_EVIDENCE_RECORDS_TABLE = 'cc_evidence_records'

// A minimal structural type for the Supabase client we depend on, so the
// accessors are testable with a mock and don't pull the full generated types.
export interface SupabaseLike {
  from(table: string): {
    insert(values: unknown): {
      select(columns?: string): { single(): Promise<{ data: unknown; error: { message: string } | null }> }
    }
    update(values: unknown): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): {
          select(columns?: string): { single(): Promise<{ data: unknown; error: { message: string } | null }> }
        }
      }
    }
    select(columns?: string): {
      eq(column: string, value: unknown): {
        eq(column: string, value: unknown): {
          order(column: string, opts: { ascending: boolean }): {
            limit(n: number): Promise<{ data: unknown; error: { message: string } | null }>
          }
          single(): Promise<{ data: unknown; error: { message: string } | null }>
        }
        order(column: string, opts: { ascending: boolean }): {
          limit(n: number): Promise<{ data: unknown; error: { message: string } | null }>
        }
      }
    }
  }
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/**
 * Create a new task row. Defaults mirror the SQL column defaults. Returns the
 * inserted row. The `client` argument is for testing — production callers omit it
 * and a founder-scoped server client is created lazily.
 */
export async function createTask(
  input: CreateTaskInput,
  client?: SupabaseLike,
): Promise<CommandCentreTask> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const row = {
    founder_id: input.founderId,
    external_ref: input.externalRef ?? null,
    queue_id: input.queueId ?? null,
    project_id: input.projectId ?? null,
    project_key: input.projectKey ?? null,
    title: input.title,
    objective: input.objective ?? '',
    priority: input.priority ?? 'P2',
    status: input.status ?? 'proposed',
    agent_owner: input.agentOwner ?? null,
    risk_level: input.riskLevel ?? 'low',
    execution_mode: input.executionMode ?? 'advisory',
    origin: input.origin ?? 'idea',
    dependencies: input.dependencies ?? [],
    human_approval_required: input.humanApprovalRequired ?? true,
    evidence_path: input.evidencePath ?? null,
    validation_required: input.validationRequired ?? [],
    linear_id: input.linearId ?? null,
    preview_url: input.previewUrl ?? null,
    metadata: input.metadata ?? {},
  }

  const { data, error } = await db.from(CC_TASKS_TABLE).insert(row).select('*').single()
  if (error) throw new Error(`createTask failed: ${error.message}`)
  return data as CommandCentreTask
}

/**
 * List founder-scoped tasks, newest first, optionally filtered by status and/or
 * project key. Capped at 100 rows.
 */
export async function listTasks(
  filter: ListTasksFilter,
  client?: SupabaseLike,
): Promise<CommandCentreTask[]> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 100)

  let query = db.from(CC_TASKS_TABLE).select('*').eq('founder_id', filter.founderId)
  if (filter.status) query = query.eq('status', filter.status) as never
  if (filter.projectKey) query = query.eq('project_key', filter.projectKey) as never

  const { data, error } = await query.order('updated_at', { ascending: false }).limit(limit)
  if (error) throw new Error(`listTasks failed: ${error.message}`)
  return (data as CommandCentreTask[]) ?? []
}

/**
 * Append an immutable audit event to a task. cc_task_events has no UPDATE/DELETE
 * policy, so this is the only write path for the audit trail.
 */
export async function appendTaskEvent(
  input: AppendTaskEventInput,
  client?: SupabaseLike,
): Promise<TaskEvent> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const row = {
    founder_id: input.founderId,
    task_id: input.taskId,
    type: input.type,
    actor: input.actor ?? 'system',
    payload: input.payload ?? {},
  }

  const { data, error } = await db.from(CC_TASK_EVENTS_TABLE).insert(row).select('*').single()
  if (error) throw new Error(`appendTaskEvent failed: ${error.message}`)
  return data as TaskEvent
}

/** Link an evidence note (wiki path + sources) to a task. */
export async function addEvidenceRecord(
  input: AddEvidenceRecordInput,
  client?: SupabaseLike,
): Promise<EvidenceRecord> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const row = {
    founder_id: input.founderId,
    task_id: input.taskId,
    kind: input.kind ?? 'brief',
    wiki_path: input.wikiPath,
    sources: input.sources ?? [],
    confidence: input.confidence ?? 'medium',
  }

  const { data, error } = await db.from(CC_EVIDENCE_RECORDS_TABLE).insert(row).select('*').single()
  if (error) throw new Error(`addEvidenceRecord failed: ${error.message}`)
  return data as EvidenceRecord
}

/**
 * Update a task's status by (founder_id, external_ref). Returns the updated row,
 * or null when no matching row exists (e.g. an external_ref that was never
 * persisted). The `client` argument is for testing — production callers omit it.
 */
export async function updateTaskStatusByExternalRef(
  input: { founderId: string; externalRef: string; status: TaskStatus },
  client?: SupabaseLike,
): Promise<CommandCentreTask | null> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const { data, error } = await db
    .from(CC_TASKS_TABLE)
    .update({ status: input.status })
    .eq('founder_id', input.founderId)
    .eq('external_ref', input.externalRef)
    .select('*')
    .single()

  // PostgREST returns an error (PGRST116) when .single() matches no rows; treat
  // a missing row as a quiet null rather than a hard failure.
  if (error) {
    if (!data) return null
    throw new Error(`updateTaskStatusByExternalRef failed: ${error.message}`)
  }
  if (!data) return null
  return data as CommandCentreTask
}

/**
 * Fetch a single founder-scoped task by id. Returns null when no matching row
 * exists (wrong id, or another founder's task hidden by RLS). The `client`
 * argument is for testing — production callers omit it.
 */
export async function getTaskById(
  input: { founderId: string; taskId: string },
  client?: SupabaseLike,
): Promise<CommandCentreTask | null> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const { data, error } = await db
    .from(CC_TASKS_TABLE)
    .select('*')
    .eq('founder_id', input.founderId)
    .eq('id', input.taskId)
    .single()

  // PostgREST returns PGRST116 from .single() when no row matches; treat a
  // missing row as a quiet null rather than a hard failure.
  if (error) {
    if (!data) return null
    throw new Error(`getTaskById failed: ${error.message}`)
  }
  return (data as CommandCentreTask) ?? null
}

/**
 * Update a task's status by (founder_id, id). Returns the updated row, or null
 * when no matching row exists. The `client` argument is for testing — production
 * callers omit it.
 */
export async function updateTaskStatus(
  input: { founderId: string; taskId: string; status: TaskStatus },
  client?: SupabaseLike,
): Promise<CommandCentreTask | null> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const { data, error } = await db
    .from(CC_TASKS_TABLE)
    .update({ status: input.status })
    .eq('founder_id', input.founderId)
    .eq('id', input.taskId)
    .select('*')
    .single()

  if (error) {
    if (!data) return null
    throw new Error(`updateTaskStatus failed: ${error.message}`)
  }
  return (data as CommandCentreTask) ?? null
}
