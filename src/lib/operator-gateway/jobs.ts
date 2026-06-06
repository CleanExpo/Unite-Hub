/**
 * Model Operator Gateway — operator job / event type layer (DB-free foundation).
 *
 * Phase OPG-4: in-repo types + pure validation helpers for the founder-scoped
 * operator_jobs / operator_events surface. There is NO live job runner and NO
 * production DB in this layer — these types define the contract that the
 * sandbox-first migration (supabase/migrations/_proposed/...) will back once
 * Board-approved and applied to the sandbox project.
 *
 * Safety invariants enforced here:
 *  - no operator job may request an API key (no-API-key gateway principle);
 *  - hard-gated task types (deploy, prod-db, payments, email, claims, secrets)
 *    are rejected by default;
 *  - external/production action flags default false.
 */

import { HARD_GATED_TASK_TYPES } from './lanes'

export type OperatorJobStatus =
  | 'planned'
  | 'queued'
  | 'running'
  | 'blocked'
  | 'done'
  | 'failed'
  | 'cancelled'

export type OperatorEventType =
  | 'created'
  | 'status_changed'
  | 'evidence_added'
  | 'gate_blocked'
  | 'note'

export interface OperatorJob {
  id: string
  founderId: string
  laneId: string
  title: string
  taskType: string
  status: OperatorJobStatus
  externalActionRequested: boolean
  productionActionRequested: boolean
  apiKeyRequested: false
  evidenceRefs: string[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface OperatorEvent {
  id: string
  founderId: string
  jobId: string
  eventType: OperatorEventType
  fromStatus: OperatorJobStatus | null
  toStatus: OperatorJobStatus | null
  detail: string
  evidenceRef: string | null
  at: string
}

export const OPERATOR_JOB_STATUSES: readonly OperatorJobStatus[] = [
  'planned',
  'queued',
  'running',
  'blocked',
  'done',
  'failed',
  'cancelled',
] as const

// Allowed forward transitions for a recorded job lifecycle (no executor — contract only).
const ALLOWED_TRANSITIONS: Record<OperatorJobStatus, OperatorJobStatus[]> = {
  planned: ['queued', 'cancelled'],
  queued: ['running', 'cancelled'],
  running: ['blocked', 'done', 'failed', 'cancelled'],
  blocked: ['running', 'failed', 'cancelled'],
  done: [],
  failed: [],
  cancelled: [],
}

export interface JobProposal {
  laneId: string
  title: string
  taskType: string
  externalActionRequested?: boolean
  productionActionRequested?: boolean
  apiKeyRequested?: boolean
}

export interface ValidationResult {
  ok: boolean
  reasons: string[]
}

/**
 * Validate a proposed operator job against the no-API-key / no-hard-gated-action
 * safety invariants. Pure function, no side effects, no DB. Returns every reason
 * a proposal is rejected (never throws).
 */
export function validateJobProposal(p: JobProposal): ValidationResult {
  const reasons: string[] = []

  if (!p.laneId) reasons.push('laneId is required')
  if (!p.title || !p.title.trim()) reasons.push('title is required')
  if (!p.taskType || !p.taskType.trim()) reasons.push('taskType is required')

  if (p.taskType && HARD_GATED_TASK_TYPES.includes(p.taskType)) {
    reasons.push(`taskType '${p.taskType}' is hard-gated and prohibited by default`)
  }
  if (p.apiKeyRequested === true) {
    reasons.push('apiKeyRequested must be false (no-API-key operator gateway principle)')
  }
  if (p.externalActionRequested === true) {
    reasons.push('externalActionRequested defaults false; enabling it is a separate Board gate')
  }
  if (p.productionActionRequested === true) {
    reasons.push('productionActionRequested defaults false; enabling it is a separate Board gate')
  }

  return { ok: reasons.length === 0, reasons }
}

/** Whether a job status transition is permitted by the lifecycle contract. */
export function canTransition(from: OperatorJobStatus, to: OperatorJobStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export interface OperatorJobsView {
  source: 'static_registry' | 'not_connected' | 'sandbox' | 'production'
  noApiKeyMode: true
  liveExecution: false
  jobCount: number
  jobs: OperatorJob[]
  note: string
}

/**
 * Read-only jobs view. The operator_jobs table is sandbox-first and NOT yet applied,
 * so this returns an empty, source-tagged ('not_connected') payload. When the
 * Board-approved sandbox migration is applied, this becomes a founder-scoped SELECT
 * and the source flips to 'sandbox'. No live execution is ever performed here.
 */
export function getOperatorJobsView(): OperatorJobsView {
  return {
    source: 'not_connected',
    noApiKeyMode: true,
    liveExecution: false,
    jobCount: 0,
    jobs: [],
    note: 'operator_jobs table is sandbox-first and not yet applied; read-only foundation. No live operator execution.',
  }
}
