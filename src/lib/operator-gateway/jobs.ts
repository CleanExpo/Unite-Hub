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
import { HARD_GATED_TASK_TYPES, getOperatorLanes } from './lanes'

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
  evidenceRefs?: string[]
  metadata?: Record<string, unknown>
  founderId?: string
  status?: OperatorJobStatus
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
  if (p.founderId) {
    reasons.push('founderId is server-derived and cannot be supplied by request body')
  }
  if (p.status && p.status !== 'planned') {
    reasons.push('status is server-controlled; sandbox job creation starts as planned only')
  }

  const lane = getOperatorLanes().find((candidate) => candidate.laneId === p.laneId)
  if (p.laneId && !lane) {
    reasons.push(`laneId '${p.laneId}' is not registered`)
  }
  if (lane && p.taskType && !lane.allowedTaskTypes.includes(p.taskType)) {
    reasons.push(`taskType '${p.taskType}' is not allowed for lane '${p.laneId}'`)
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
type MutationResult<T> = Promise<{ data: T | null; error: { message?: string } | null }>

export interface OperatorJobsReadClient {
  from(table: 'operator_jobs'): {
    select(columns: string): {
      eq(column: 'founder_id', value: string): {
        order(column: 'created_at', options: { ascending: false }): QueryResult<OperatorJobRow>
      }
    }
  }
}

export interface OperatorJobsWriteClient {
  from(table: 'operator_jobs'): {
    insert(payload: OperatorJobInsert): {
      select(columns: string): {
        single(): MutationResult<OperatorJobRow>
      }
    }
  }
  from(table: 'operator_events'): {
    insert(payload: OperatorEventInsert): Promise<{ data: unknown; error: { message?: string } | null }>
  }
}

export interface OperatorJobsDryRunClient {
  from(table: 'operator_jobs'): {
    select(columns: string): {
      eq(column: 'id', value: string): {
        eq(column: 'founder_id', value: string): {
          single(): MutationResult<OperatorJobRow>
        }
      }
    }
    update(payload: OperatorJobUpdate): {
      eq(column: 'id', value: string): {
        eq(column: 'founder_id', value: string): {
          select(columns: string): {
            single(): MutationResult<OperatorJobRow>
          }
        }
      }
    }
  }
  from(table: 'operator_events'): {
    insert(payload: OperatorDryRunEventInsert): Promise<{ data: unknown; error: { message?: string } | null }>
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

interface OperatorJobInsert {
  founder_id: string
  lane_id: string
  title: string
  task_type: string
  status: 'planned'
  external_action_requested: false
  production_action_requested: false
  api_key_requested: false
  evidence_refs: string[]
  metadata: Record<string, unknown>
}

interface OperatorEventInsert {
  founder_id: string
  job_id: string
  event_type: 'created'
  from_status: null
  to_status: 'planned'
  detail: string
  evidence_ref: string | null
}

interface OperatorJobUpdate {
  status: 'done'
  evidence_refs: string[]
  metadata: Record<string, unknown>
}

interface OperatorDryRunEventInsert {
  founder_id: string
  job_id: string
  event_type: 'status_changed'
  from_status: OperatorJobStatus
  to_status: 'done'
  detail: string
  evidence_ref: string
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

export function getSandboxOperatorJobsClient(): (OperatorJobsReadClient & OperatorJobsWriteClient & OperatorJobsDryRunClient) | null {
  const url = process.env.OPERATOR_GATEWAY_SANDBOX_SUPABASE_URL
  const anonKey = process.env.OPERATOR_GATEWAY_SANDBOX_SUPABASE_ANON_KEY

  if (!isApprovedSandboxSupabaseUrl(url) || !anonKey) return null

  return createClient(url!, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) as unknown as OperatorJobsReadClient & OperatorJobsWriteClient & OperatorJobsDryRunClient
}


export interface CreateSandboxOperatorJobOptions {
  founderId?: string
  client?: OperatorJobsWriteClient | null
  proposal: JobProposal
}

export type CreateSandboxOperatorJobResult =
  | {
      ok: true
      status: 201
      source: 'sandbox_insert'
      jobCreation: 'sandbox_enabled'
      liveExecution: false
      externalExecutionEnabled: false
      productionConnected: false
      eventAppended: true
      job: OperatorJob
    }
  | {
      ok: false
      status: 400 | 503
      source: 'validation_failed' | 'not_connected' | 'sandbox_insert_failed' | 'sandbox_event_insert_failed'
      error: string
      reasons: string[]
      liveExecution: false
      externalExecutionEnabled: false
      productionConnected: false
      jobCreation: 'sandbox_rejected'
    }

function sanitizeEvidenceRefs(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 10)
}

function sanitizeMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const forbidden = /secret|token|api[_-]?key|password|credential/i
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, entry]) => !forbidden.test(key) && typeof entry !== 'function')
      .slice(0, 25),
  )
}

export async function createSandboxOperatorJob(options: CreateSandboxOperatorJobOptions): Promise<CreateSandboxOperatorJobResult> {
  const { founderId, client, proposal } = options
  const validation = validateJobProposal(proposal)

  if (!founderId) {
    return {
      ok: false,
      status: 400,
      source: 'validation_failed',
      error: 'Sandbox job creation rejected by safety validation.',
      reasons: ['founder/session is required'],
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      jobCreation: 'sandbox_rejected',
    }
  }
  if (!validation.ok || validation.reasons.length > 0) {
    return {
      ok: false,
      status: 400,
      source: 'validation_failed',
      error: 'Sandbox job creation rejected by safety validation.',
      reasons: validation.reasons,
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      jobCreation: 'sandbox_rejected',
    }
  }

  if (!client) {
    return {
      ok: false,
      status: 503,
      source: 'not_connected',
      error: 'Sandbox operator_jobs INSERT is unavailable; no production fallback exists.',
      reasons: ['approved sandbox write client is not configured'],
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      jobCreation: 'sandbox_rejected',
    }
  }

  const payload: OperatorJobInsert = {
    founder_id: founderId,
    lane_id: proposal.laneId,
    title: proposal.title.trim(),
    task_type: proposal.taskType,
    status: 'planned',
    external_action_requested: false,
    production_action_requested: false,
    api_key_requested: false,
    evidence_refs: sanitizeEvidenceRefs(proposal.evidenceRefs),
    metadata: sanitizeMetadata(proposal.metadata),
  }

  try {
    const { data, error } = await client
      .from('operator_jobs')
      .insert(payload)
      .select(OPERATOR_JOBS_SELECT)
      .single()

    if (error || !data) {
      return {
        ok: false,
        status: 503,
        source: 'sandbox_insert_failed',
        error: `Sandbox operator_jobs INSERT failed: ${error?.message ?? 'no row returned'}`,
        reasons: ['sandbox operator_jobs insert failed'],
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        jobCreation: 'sandbox_rejected',
      }
    }

    const job = mapOperatorJobRow(data)
    if (!job) {
      return {
        ok: false,
        status: 503,
        source: 'sandbox_insert_failed',
        error: 'Sandbox operator_jobs INSERT returned a row that violates no-API-key invariants.',
        reasons: ['inserted row failed safety mapping'],
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        jobCreation: 'sandbox_rejected',
      }
    }

    const eventPayload: OperatorEventInsert = {
      founder_id: founderId,
      job_id: job.id,
      event_type: 'created',
      from_status: null,
      to_status: 'planned',
      detail: 'Sandbox-only operator job created. External execution and live runner remain disabled.',
      evidence_ref: null,
    }
    const eventResult = await client.from('operator_events').insert(eventPayload)
    if (eventResult.error) {
      return {
        ok: false,
        status: 503,
        source: 'sandbox_event_insert_failed',
        error: `Sandbox operator_events INSERT failed: ${eventResult.error.message ?? 'unknown error'}`,
        reasons: ['sandbox operator_events append failed'],
        liveExecution: false,
        externalExecutionEnabled: false,
        productionConnected: false,
        jobCreation: 'sandbox_rejected',
      }
    }

    return {
      ok: true,
      status: 201,
      source: 'sandbox_insert',
      jobCreation: 'sandbox_enabled',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      eventAppended: true,
      job,
    }
  } catch {
    return {
      ok: false,
      status: 503,
      source: 'sandbox_insert_failed',
      error: 'Sandbox operator job creation failed due to runtime error.',
      reasons: ['sandbox write runtime error'],
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      jobCreation: 'sandbox_rejected',
    }
  }
}

export const OPERATOR_GATEWAY_DRY_RUN_EVIDENCE_REF = '2nd-brain/.agentic_nexus/OPERATOR_GATEWAY_SANDBOX_DRY_RUN_EXECUTION_EVIDENCE_PACKET.md'

export interface DryRunSandboxOperatorJobOptions {
  founderId?: string
  client?: OperatorJobsDryRunClient | null
  jobId?: string
  dryRunReason?: string
  externalActionRequested?: boolean
  productionActionRequested?: boolean
  apiKeyRequested?: boolean
  now?: () => string
}

export type DryRunSandboxOperatorJobResult =
  | {
      ok: true
      status: 200
      source: 'sandbox_dry_run'
      dryRunExecution: 'sandbox_enabled'
      liveExecution: false
      externalExecutionEnabled: false
      productionConnected: false
      eventAppended: true
      jobStatusUpdated: true
      job: OperatorJob
      event: {
        eventType: 'status_changed'
        fromStatus: OperatorJobStatus
        toStatus: 'done'
        evidenceRef: string
        detail: string
      }
    }
  | {
      ok: false
      status: 400 | 404 | 503
      source: 'validation_failed' | 'not_connected' | 'sandbox_job_not_found' | 'sandbox_dry_run_refused' | 'sandbox_update_failed' | 'sandbox_event_insert_failed'
      error: string
      reasons: string[]
      dryRunExecution: 'sandbox_rejected'
      liveExecution: false
      externalExecutionEnabled: false
      productionConnected: false
      eventAppended: false
      jobStatusUpdated: false
    }

function sanitizeDryRunReason(value: unknown): string {
  if (typeof value !== 'string') return 'Operator requested sandbox dry-run lifecycle proof.'
  const forbidden = /secret|token|api[_-]?key|password|credential/i
  const safe = value
    .split(/\r?\n/)
    .filter((line) => !forbidden.test(line))
    .join(' ')
    .trim()
    .slice(0, 240)
  return safe || 'Operator requested sandbox dry-run lifecycle proof.'
}


function dryRunRejection(
  status: Extract<DryRunSandboxOperatorJobResult, { ok: false }>['status'],
  source: Extract<DryRunSandboxOperatorJobResult, { ok: false }>['source'],
  error: string,
  reasons: string[],
): DryRunSandboxOperatorJobResult {
  return {
    ok: false,
    status,
    source,
    error,
    reasons,
    dryRunExecution: 'sandbox_rejected',
    liveExecution: false,
    externalExecutionEnabled: false,
    productionConnected: false,
    eventAppended: false,
    jobStatusUpdated: false,
  }
}

export async function dryRunSandboxOperatorJob(options: DryRunSandboxOperatorJobOptions): Promise<DryRunSandboxOperatorJobResult> {
  const { founderId, client, jobId } = options
  if (!founderId) return dryRunRejection(400, 'validation_failed', 'Sandbox dry-run rejected by safety validation.', ['founder/session is required'])
  if (!jobId || !jobId.trim()) return dryRunRejection(400, 'validation_failed', 'Sandbox dry-run rejected by safety validation.', ['jobId is required'])
  if (options.externalActionRequested === true) return dryRunRejection(400, 'validation_failed', 'Sandbox dry-run refuses external execution requests.', ['externalActionRequested must remain false'])
  if (options.productionActionRequested === true) return dryRunRejection(400, 'validation_failed', 'Sandbox dry-run refuses production action requests.', ['productionActionRequested must remain false'])
  if (options.apiKeyRequested === true) return dryRunRejection(400, 'validation_failed', 'Sandbox dry-run refuses API-key requests.', ['apiKeyRequested must remain false'])
  if (!client) return dryRunRejection(503, 'not_connected', 'Sandbox operator_jobs dry-run is unavailable; no production fallback exists.', ['approved sandbox write client is not configured'])

  try {
    const existingResult = await client
      .from('operator_jobs')
      .select(OPERATOR_JOBS_SELECT)
      .eq('id', jobId.trim())
      .eq('founder_id', founderId)
      .single()
    if (existingResult.error || !existingResult.data) {
      return dryRunRejection(404, 'sandbox_job_not_found', 'Sandbox operator job not found for founder.', ['sandbox operator job not found'])
    }
    const job = mapOperatorJobRow(existingResult.data)
    if (!job) return dryRunRejection(400, 'sandbox_dry_run_refused', 'Sandbox dry-run refused unsafe job row.', ['job violates no-API-key invariants'])

    const reasons: string[] = []
    if (job.status !== 'planned') reasons.push(`job status '${job.status}' is not dry-runnable; expected planned`)
    if (HARD_GATED_TASK_TYPES.includes(job.taskType)) reasons.push(`taskType '${job.taskType}' is hard-gated and prohibited by default`)
    if (job.apiKeyRequested !== false) reasons.push('apiKeyRequested must be false')
    if (job.externalActionRequested) reasons.push('externalActionRequested must be false')
    if (job.productionActionRequested) reasons.push('productionActionRequested must be false')
    if (reasons.length) return dryRunRejection(400, 'sandbox_dry_run_refused', 'Sandbox dry-run refused by safety validation.', reasons)

    const completedAt = options.now?.() ?? new Date().toISOString()
    const reason = sanitizeDryRunReason(options.dryRunReason)
    const evidenceRefs = Array.from(new Set([...job.evidenceRefs, OPERATOR_GATEWAY_DRY_RUN_EVIDENCE_REF]))
    const metadata = {
      ...job.metadata,
      dryRun: {
        status: 'completed',
        completedAt,
        reason,
        externalExecution: false,
        liveRunner: false,
        productionDbTouched: false,
      },
    }
    const updateResult = await client
      .from('operator_jobs')
      .update({ status: 'done', evidence_refs: evidenceRefs, metadata })
      .eq('id', job.id)
      .eq('founder_id', founderId)
      .select(OPERATOR_JOBS_SELECT)
      .single()
    if (updateResult.error || !updateResult.data) {
      return dryRunRejection(503, 'sandbox_update_failed', 'Sandbox dry-run job status update failed.', ['sandbox operator_jobs update failed'])
    }
    const updatedJob = mapOperatorJobRow(updateResult.data)
    if (!updatedJob) return dryRunRejection(503, 'sandbox_update_failed', 'Sandbox dry-run update returned unsafe row.', ['updated row failed safety mapping'])

    const detail = `Sandbox dry-run completed for job ${job.id}. No external execution occurred. Live runner disabled. Production DB not connected. Reason: ${reason}`
    const eventResult = await client.from('operator_events').insert({
      founder_id: founderId,
      job_id: job.id,
      event_type: 'status_changed',
      from_status: job.status,
      to_status: 'done',
      detail,
      evidence_ref: OPERATOR_GATEWAY_DRY_RUN_EVIDENCE_REF,
    })
    if (eventResult.error) {
      return dryRunRejection(503, 'sandbox_event_insert_failed', 'Sandbox dry-run event append failed.', ['sandbox operator_events append failed'])
    }

    return {
      ok: true,
      status: 200,
      source: 'sandbox_dry_run',
      dryRunExecution: 'sandbox_enabled',
      liveExecution: false,
      externalExecutionEnabled: false,
      productionConnected: false,
      eventAppended: true,
      jobStatusUpdated: true,
      job: updatedJob,
      event: {
        eventType: 'status_changed',
        fromStatus: job.status,
        toStatus: 'done',
        evidenceRef: OPERATOR_GATEWAY_DRY_RUN_EVIDENCE_REF,
        detail,
      },
    }
  } catch {
    return dryRunRejection(503, 'sandbox_update_failed', 'Sandbox dry-run failed due to runtime error.', ['sandbox dry-run runtime error'])
  }
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
