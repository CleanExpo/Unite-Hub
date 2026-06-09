// src/lib/command-centre/approvals.ts
//
// CC-11 — Approvals lane. Typed accessors over the cc_approvals table
// (20260604010000_cc_command_centre_phase2.sql) plus the orchestration that
// turns an approval decision into a task status transition + audit event.
//
// No remote calls are made at import time — the Supabase server client is
// created lazily inside each accessor (matching tasks.ts). All rows are
// founder-scoped by RLS (founder_id = auth.uid()).

import { createClient } from '@/lib/supabase/server'
import {
  appendTaskEvent,
  updateTaskStatus,
  type SupabaseLike,
  type TaskStatus,
  type CommandCentreTask,
} from './tasks'

// ─── Types (mirror the SQL schema) ────────────────────────────────────────────

/** cc_approvals.decision CHECK (approve/reject/edit/defer). */
export type ApprovalDecision = 'approve' | 'reject' | 'edit' | 'defer'

/** An approval decision row (cc_approvals). */
export interface Approval {
  id: string
  founder_id: string
  task_id: string
  decision: ApprovalDecision
  approver: string
  note: string | null
  at: string
}

export interface RecordApprovalInput {
  founderId: string
  taskId: string
  decision: ApprovalDecision
  approver?: string
  note?: string | null
}

export interface ListApprovalsFilter {
  founderId: string
  taskId: string
  limit?: number
}

// Table name constant — single source of truth, asserted by tests.
export const CC_APPROVALS_TABLE = 'cc_approvals'

/**
 * Map an approval decision to the resulting task status.
 *  - approve → queued   (promoted into the actionable queue)
 *  - reject  → failed   (closed out, audited)
 *  - defer   → blocked  (parked; can be revisited)
 *  - edit    → null     (stays as-is; the note is recorded, no transition)
 * Pure + exported so the mapping is unit-tested without any DB.
 */
export function decisionToStatus(decision: ApprovalDecision): TaskStatus | null {
  switch (decision) {
    case 'approve':
      return 'queued'
    case 'reject':
      return 'failed'
    case 'defer':
      return 'blocked'
    case 'edit':
      return null
  }
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/** Insert an approval decision row. Returns the inserted row. */
export async function recordApproval(
  input: RecordApprovalInput,
  client?: SupabaseLike,
): Promise<Approval> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const row = {
    founder_id: input.founderId,
    task_id: input.taskId,
    decision: input.decision,
    approver: input.approver ?? 'founder',
    note: input.note ?? null,
  }

  const { data, error } = await db.from(CC_APPROVALS_TABLE).insert(row).select('*').single()
  if (error) throw new Error(`recordApproval failed: ${error.message}`)
  return data as Approval
}

/** List a task's approval history, newest first. Capped at 100 rows. */
export async function listApprovalsForTask(
  filter: ListApprovalsFilter,
  client?: SupabaseLike,
): Promise<Approval[]> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 100)

  const { data, error } = await db
    .from(CC_APPROVALS_TABLE)
    .select('*')
    .eq('founder_id', filter.founderId)
    .eq('task_id', filter.taskId)
    .order('at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`listApprovalsForTask failed: ${error.message}`)
  return (data as Approval[]) ?? []
}

export interface ApplyApprovalResult {
  approval: Approval
  /** The updated task, or null if the decision implied no status change (edit). */
  task: CommandCentreTask | null
}

/**
 * Apply an approval decision end-to-end:
 *   1. record the decision in cc_approvals (audit of intent),
 *   2. transition the task status when the decision implies one,
 *   3. append an immutable 'approved' task event.
 * The status change + event are best-effort relative to the recorded decision,
 * which is the source of truth. Returns both rows.
 */
export async function applyApproval(
  input: RecordApprovalInput,
  client?: SupabaseLike,
): Promise<ApplyApprovalResult> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const approval = await recordApproval(input, db)

  const nextStatus = decisionToStatus(input.decision)
  let task: CommandCentreTask | null = null
  if (nextStatus) {
    task = await updateTaskStatus(
      { founderId: input.founderId, taskId: input.taskId, status: nextStatus },
      db,
    )
  }

  await appendTaskEvent(
    {
      founderId: input.founderId,
      taskId: input.taskId,
      type: 'approved',
      actor: input.approver ?? 'founder',
      payload: { decision: input.decision, note: input.note ?? null, new_status: nextStatus },
    },
    db,
  )

  return { approval, task }
}
