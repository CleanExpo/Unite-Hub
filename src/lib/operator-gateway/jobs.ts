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

import { createClient } from '@supabase/supabase-js'
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

export const OPERATOR_GATEWAY_SANDBOX_PROJECT_REF = 'xgqwfwqumliuguzhshwv'

export interface OperatorJobsView {
  source: 'static_registry' | 'not_connected' | 'sandbox_select' | 'production'
  noApiKeyMode: true
  liveExecution: false
  jobCount: number
  jobs: OperatorJob[]
  note: string
}

type QueryResult<T> = Promise<{ data: T[] | null; error: { message?: string } | null }>

export interface OperatorJobsReadClient {
  from(table: 'operator_jobs'): {
    select(columns: string): {
      eq(column: 'founder_id', value: string): {
        order(column: 'created_at', options: { ascending: false }): QueryResult<OperatorJobRow>
      }
    }
  }
}

interface OperatorJobRow {
  id: string
  founder_id: string
  lane_id: string
  title: string
  task_type: string
  status: OperatorJobStatus
  external_action_requested: boolean
  production_action_requested: boolean
  api_key_requested: boolean
  evidence_refs: string[] | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface OperatorJobsViewOptions {
  founderId?: string
  client?: OperatorJobsReadClient | null
}

export function getOperatorJobsFallbackView(reason = 'Sandbox operator_jobs SELECT is unavailable; read-only fallback. No live operator execution.'): OperatorJobsView {
  return {
    source: 'not_connected',
    noApiKeyMode: true,
    liveExecution: false,
    jobCount: 0,
    jobs: [],
    note: reason,
  }
}

function mapOperatorJobRow(row: OperatorJobRow): OperatorJob | null {
  if (row.api_key_requested !== false) return null
  return {
    id: row.id,
    founderId: row.founder_id,
    laneId: row.lane_id,
    title: row.title,
    taskType: row.task_type,
    status: row.status,
    externalActionRequested: row.external_action_requested,
    productionActionRequested: row.production_action_requested,
    apiKeyRequested: false,
    evidenceRefs: row.evidence_refs ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const OPERATOR_JOBS_SELECT = [
  'id',
  'founder_id',
  'lane_id',
  'title',
  'task_type',
  'status',
  'external_action_requested',
  'production_action_requested',
  'api_key_requested',
  'evidence_refs',
  'metadata',
  'created_at',
  'updated_at',
].join(',')

export function isApprovedSandboxSupabaseUrl(url: string | undefined): boolean {
  return Boolean(url && url.includes(`${OPERATOR_GATEWAY_SANDBOX_PROJECT_REF}.supabase.co`))
}

export function getSandboxOperatorJobsClient(): OperatorJobsReadClient | null {
  const url = process.env.OPERATOR_GATEWAY_SANDBOX_SUPABASE_URL
  const anonKey = process.env.OPERATOR_GATEWAY_SANDBOX_SUPABASE_ANON_KEY

  if (!isApprovedSandboxSupabaseUrl(url) || !anonKey) return null

  return createClient(url!, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as OperatorJobsReadClient
}

/**
 * Read-only jobs view. When an approved sandbox client is provided/configured,
 * performs founder-scoped SELECT against operator_jobs and returns
 * source='sandbox_select'. Otherwise it fails closed to not_connected. No DB writes,
 * API-key mode, production DB access, or live execution occurs here.
 */
export async function getOperatorJobsView(options: OperatorJobsViewOptions = {}): Promise<OperatorJobsView> {
  const { founderId, client = null } = options
  if (!founderId || !client) return getOperatorJobsFallbackView()

  try {
    const { data, error } = await client
      .from('operator_jobs')
      .select(OPERATOR_JOBS_SELECT)
      .eq('founder_id', founderId)
      .order('created_at', { ascending: false })

    if (error) {
      return getOperatorJobsFallbackView(`Sandbox operator_jobs SELECT unavailable: ${error.message ?? 'unknown error'}. No live operator execution.`)
    }

    const jobs = (data ?? []).map(mapOperatorJobRow).filter((job): job is OperatorJob => job !== null)
    return {
      source: 'sandbox_select',
      noApiKeyMode: true,
      liveExecution: false,
      jobCount: jobs.length,
      jobs,
      note: `sandbox persistence connected; ${jobs.length} jobs visible. Job creation and live execution remain disabled.`,
    }
  } catch {
    return getOperatorJobsFallbackView('Sandbox operator_jobs SELECT unavailable due to runtime error. No live operator execution.')
  }
}
