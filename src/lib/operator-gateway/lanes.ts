/**
 * Model Operator Gateway — operator lane registry (static, DB-free foundation).
 *
 * Architecture principle: operator-side CLI/session execution gateway.
 * Lanes are operator CLI sessions or local runtimes — NEVER API-key integrations.
 * Max/Pro plan subscriptions are operator sessions, not backend credentials.
 * No lane sets apiKeyRequired=true unless a separate Board approval adds one.
 *
 * Canonical source of truth mirrors:
 *   2nd-brain/.agentic_nexus/model_operator_lanes.jsonl
 *   2nd-brain/.agentic_nexus/model_operator_lanes.schema.json
 */

export type LaneAuthMode = 'cli_session' | 'plan_session' | 'local_runtime' | 'not_installed'
export type LaneStatus = 'active' | 'design_only' | 'not_installed' | 'disabled'

export interface OperatorLane {
  laneId: string
  provider: string
  tool: string
  authMode: LaneAuthMode
  maxPlanBased: boolean
  apiKeyRequired: false
  allowedTaskTypes: string[]
  prohibitedTaskTypes: string[]
  externalActionAllowed: boolean
  productionActionAllowed: boolean
  requiresHumanSession: boolean
  evidenceRequired: string[]
  status: LaneStatus
  lastVerifiedAt: string | null
  notes: string
}

const CODE_TASKS = ['feature_implementation', 'refactor', 'code_review', 'test_authoring', 'documentation']
// Exported so the operator job layer (jobs.ts) can reject hard-gated work by default.
export const HARD_GATED_TASK_TYPES = [
  'production_deploy',
  'production_db_write',
  'payments',
  'email_send',
  'claims_orders',
  'secrets_access',
]
const HARD_GATED_TASKS = HARD_GATED_TASK_TYPES

export const OPERATOR_LANES: readonly OperatorLane[] = [
  {
    laneId: 'claude_code_max_primary',
    provider: 'anthropic',
    tool: 'claude code',
    authMode: 'not_installed',
    maxPlanBased: true,
    apiKeyRequired: false,
    allowedTaskTypes: CODE_TASKS,
    prohibitedTaskTypes: HARD_GATED_TASKS,
    externalActionAllowed: false,
    productionActionAllowed: false,
    requiresHumanSession: true,
    evidenceRequired: ['summary', 'diff', 'tests_run', 'audit_record'],
    status: 'design_only',
    lastVerifiedAt: null,
    notes: 'Claude Code (Claude Max plan operator session). Not installed yet. Plan session, never an API key.',
  },
  {
    laneId: 'claude_code_max_secondary',
    provider: 'anthropic',
    tool: 'claude code',
    authMode: 'not_installed',
    maxPlanBased: true,
    apiKeyRequired: false,
    allowedTaskTypes: CODE_TASKS,
    prohibitedTaskTypes: HARD_GATED_TASKS,
    externalActionAllowed: false,
    productionActionAllowed: false,
    requiresHumanSession: true,
    evidenceRequired: ['summary', 'diff', 'tests_run', 'audit_record'],
    status: 'design_only',
    lastVerifiedAt: null,
    notes: 'Secondary Claude Code lane (parallel work / second-opinion review). Design-only until installed.',
  },
  {
    laneId: 'openai_codex_max',
    provider: 'openai',
    tool: 'codex exec',
    authMode: 'plan_session',
    maxPlanBased: true,
    apiKeyRequired: false,
    allowedTaskTypes: [...CODE_TASKS, 'bounded_edit', 'mechanical_migration'],
    prohibitedTaskTypes: [...HARD_GATED_TASKS, 'live_order_entry'],
    externalActionAllowed: false,
    productionActionAllowed: false,
    requiresHumanSession: true,
    evidenceRequired: ['summary', 'diff', 'tests_run', 'artifact_path', 'audit_record'],
    status: 'active',
    lastVerifiedAt: '2026-06-06T09:55:00Z',
    notes: 'OpenAI Codex CLI plan/OAuth session. Run bounded work with `codex exec` in an isolated git worktree; Hermes owns lifecycle + reconciliation. Input lane only.',
  },
  {
    laneId: 'cursor_cli',
    provider: 'cursor',
    tool: 'cursor-agent',
    authMode: 'not_installed',
    maxPlanBased: true,
    apiKeyRequired: false,
    allowedTaskTypes: ['feature_implementation', 'refactor', 'bounded_edit', 'documentation'],
    prohibitedTaskTypes: HARD_GATED_TASKS,
    externalActionAllowed: false,
    productionActionAllowed: false,
    requiresHumanSession: true,
    evidenceRequired: ['summary', 'diff', 'tests_run', 'audit_record'],
    status: 'not_installed',
    lastVerifiedAt: null,
    notes: 'Cursor CLI (cursor-agent). Not installed yet. Plan session, never an API key.',
  },
  {
    laneId: 'hermes_local',
    provider: 'hermes',
    tool: 'hermes',
    authMode: 'local_runtime',
    maxPlanBased: false,
    apiKeyRequired: false,
    allowedTaskTypes: [
      'orchestration',
      'planning',
      'reconciliation',
      'verification',
      'documentation',
      'evidence_audit',
      'dashboard',
      'skill_management',
      'bounded_edit',
      'test_run',
    ],
    prohibitedTaskTypes: HARD_GATED_TASKS,
    externalActionAllowed: false,
    productionActionAllowed: false,
    requiresHumanSession: false,
    evidenceRequired: ['summary', 'audit_record'],
    status: 'active',
    lastVerifiedAt: '2026-06-06T09:55:00Z',
    notes: 'Hermes Agent orchestrator runtime and task-lifecycle owner. CLI-session model lanes are input lanes to Hermes.',
  },
  {
    laneId: 'agentic_nexus_skill_exec',
    provider: 'agentic_nexus',
    tool: 'skill_exec',
    authMode: 'local_runtime',
    maxPlanBased: false,
    apiKeyRequired: false,
    allowedTaskTypes: ['skill_run', 'registered_procedure', 'dashboard', 'evidence_audit', 'diagnostic'],
    prohibitedTaskTypes: [...HARD_GATED_TASKS, 'live_skill_activation'],
    externalActionAllowed: false,
    productionActionAllowed: false,
    requiresHumanSession: false,
    evidenceRequired: ['summary', 'stdout', 'exit_code', 'audit_record'],
    status: 'active',
    lastVerifiedAt: '2026-06-06T09:55:00Z',
    notes: 'Agentic Nexus skill/script execution lane (stdlib-only control-plane scripts, registered skills). Local, sandboxed. Dry-run preferred; no live activation.',
  },
] as const

export function getOperatorLanes(): readonly OperatorLane[] {
  return OPERATOR_LANES
}

export interface GatewayStatus {
  source: 'static_registry' | 'not_connected'
  gateway: 'model_operator_gateway'
  noApiKeyMode: true
  laneCount: number
  activeLaneCount: number
  blockedOrUnavailableLaneCount: number
  maxPlanLaneCount: number
  anyApiKeyLane: boolean
  lanes: { laneId: string; status: LaneStatus; provider: string; authMode: LaneAuthMode }[]
}

export function getGatewayStatus(): GatewayStatus {
  const lanes = getOperatorLanes()
  const active = lanes.filter((l) => l.status === 'active')
  const unavailable = lanes.filter((l) => l.status !== 'active')
  return {
    source: 'static_registry',
    gateway: 'model_operator_gateway',
    noApiKeyMode: true,
    laneCount: lanes.length,
    activeLaneCount: active.length,
    blockedOrUnavailableLaneCount: unavailable.length,
    maxPlanLaneCount: lanes.filter((l) => l.maxPlanBased).length,
    anyApiKeyLane: lanes.some((l) => l.apiKeyRequired as boolean),
    lanes: lanes.map((l) => ({ laneId: l.laneId, status: l.status, provider: l.provider, authMode: l.authMode })),
  }
}
