// src/lib/command-centre/approvals.ts
//
// Human approval decisions gating task promotion (cc_approvals).
//
// recordApproval writes three things atomically-ish (best-effort ordering):
//   1. a cc_approvals row capturing the decision + note
//   2. an immutable cc_task_events audit event
//   3. a task status transition:
//        approve → queued
//        reject  → blocked
//        defer   → proposed
//
// No remote calls are made at import time — the Supabase server client is
// created lazily inside the accessor (matching tasks.ts / decisions.ts).
// All rows are founder-scoped by RLS (founder_id = auth.uid()).

import { createClient } from '@/lib/supabase/server'
import {
  appendTaskEvent,
  updateTaskStatusById,
  type CommandCentreTask,
  type SupabaseLike,
  type TaskStatus,
  type TaskEventType,
} from './tasks'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Human approval decisions per the cc_approvals CHECK constraint. */
export type ApprovalDecision = 'approve' | 'reject' | 'edit' | 'defer'

/** A durable approval row (cc_approvals). */
export interface CommandCentreApproval {
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
  note?: string | null
  approver?: string
}

export interface RecordApprovalResult {
  approval: CommandCentreApproval
  task: CommandCentreTask | null
}

// Table name constant — single source of truth, asserted by tests.
export const CC_APPROVALS_TABLE = 'cc_approvals'

// Decision → resulting task status. `edit` keeps the task awaiting approval
// (an edit is a request for changes, not a promotion or a block).
const DECISION_TO_STATUS: Record<ApprovalDecision, TaskStatus> = {
  approve: 'queued',
  reject: 'blocked',
  defer: 'proposed',
  edit: 'awaiting_approval',
}

// Decision → audit event type (reuses the cc_task_events vocabulary).
const DECISION_TO_EVENT: Record<ApprovalDecision, TaskEventType> = {
  approve: 'approved',
  reject: 'blocked',
  defer: 'status_changed',
  edit: 'comment',
}

/** Map an approval decision to the task status it transitions to. */
export function statusForDecision(decision: ApprovalDecision): TaskStatus {
  return DECISION_TO_STATUS[decision]
}

// ─── Accessor ──────────────────────────────────────────────────────────────────

/**
 * Record a human approval decision: write the cc_approvals row, append a
 * cc_task_events audit event, and transition the task's status. Returns the
 * approval row and the updated task (null if the task no longer exists).
 * The `client` argument is for testing — production callers omit it.
 */
export async function recordApproval(
  input: RecordApprovalInput,
  client?: SupabaseLike,
): Promise<RecordApprovalResult> {
  const db = client ?? ((await createClient()) as unknown as SupabaseLike)

  const decision = input.decision
  const nextStatus = DECISION_TO_STATUS[decision]
  const approver = input.approver ?? 'founder'
  const note = input.note ?? null

  // 1. Persist the approval decision.
  const approvalRow = {
    founder_id: input.founderId,
    task_id: input.taskId,
    decision,
    approver,
    note,
  }
  const { data, error } = await db
    .from(CC_APPROVALS_TABLE)
    .insert(approvalRow)
    .select('*')
    .single()
  if (error) throw new Error(`recordApproval failed: ${error.message}`)
  const approval = data as CommandCentreApproval

  // 2. Append the immutable audit event.
  await appendTaskEvent(
    {
      founderId: input.founderId,
      taskId: input.taskId,
      type: DECISION_TO_EVENT[decision],
      actor: approver,
      payload: { decision, note, status: nextStatus, approval_id: approval.id },
    },
    db,
  )

  // 3. Transition the task status.
  const task = await updateTaskStatusById(
    { founderId: input.founderId, taskId: input.taskId, status: nextStatus },
    db,
  )

  return { approval, task }
}
