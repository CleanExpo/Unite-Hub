export type PiDevOpsWorkflowFinalState = 'complete' | 'blocked' | 'rolled_back' | 'in_progress'

export interface PiDevOpsWorkflowManifest {
  workflow_id?: string
  version?: string
  intent?: string
  gates?: string[]
  model_routing?: Record<string, string>
  budgets?: Record<string, unknown>
  governance?: Record<string, unknown>
  verification?: Record<string, unknown>
}

export interface PiDevOpsWorkflowEvidence {
  workflow_id?: string
  request?: string
  final_state?: PiDevOpsWorkflowFinalState | string
  blockers?: string[]
  actual_changed_files?: string[]
  verification_results?: Array<{ command?: string; result?: string }>
  connection_map?: Record<string, unknown>
}

export interface PiDevOpsWorkflowState {
  workflowId: string
  evidenceId: string | null
  intent: string
  status: PiDevOpsWorkflowFinalState
  currentGate: string
  gates: string[]
  modelRoute: {
    planner: string
    implementer: string
    challenger: string
    opusUltrathink: string
  }
  requiresMargotReview: boolean
  allowsPush: boolean
  threeLoopRequired: boolean
  changedFileCount: number
  verificationSummary: string
  blockers: string[]
  connectionCount: number
  nextAction: string
}

export function buildPiDevOpsWorkflowState(input: {
  manifest: PiDevOpsWorkflowManifest
  evidence: PiDevOpsWorkflowEvidence
}): PiDevOpsWorkflowState {
  const gates = input.manifest.gates?.length ? input.manifest.gates : ['intake', 'connection', 'verification', 'review', 'finalise']
  const status = normalizeFinalState(input.evidence.final_state)
  const blockers = input.evidence.blockers ?? []
  const verificationResults = input.evidence.verification_results ?? []
  const changedFiles = input.evidence.actual_changed_files ?? []
  const connectionCount = Object.keys(input.evidence.connection_map ?? {}).length

  return {
    workflowId: input.manifest.workflow_id ?? 'pi-dev-ops-workflow',
    evidenceId: input.evidence.workflow_id ?? null,
    intent: input.manifest.intent ?? input.evidence.request ?? 'Pi-Dev-Ops senior engineer workflow',
    status,
    currentGate: currentGateFor(status, blockers, verificationResults, gates),
    gates,
    modelRoute: {
      planner: input.manifest.model_routing?.planner ?? 'gpt-5.5-class',
      implementer: input.manifest.model_routing?.implementer ?? 'gpt-5.5-class',
      challenger: input.manifest.model_routing?.challenger ?? 'kimi-2.5-class',
      opusUltrathink:
        input.manifest.model_routing?.opus_ultrathink ?? 'explicit Claude Code OAuth/subscription or approved provider path only',
    },
    requiresMargotReview: Boolean(input.manifest.governance?.requires_margot_review),
    allowsPush: Boolean(input.manifest.governance?.allows_push),
    threeLoopRequired: Boolean(input.manifest.verification?.three_loop_required_for_code_changes),
    changedFileCount: changedFiles.length,
    verificationSummary: summarizeVerification(verificationResults),
    blockers,
    connectionCount,
    nextAction: nextActionFor(status, blockers),
  }
}

function normalizeFinalState(value: string | undefined): PiDevOpsWorkflowFinalState {
  if (value === 'complete' || value === 'blocked' || value === 'rolled_back') return value
  return 'in_progress'
}

function currentGateFor(
  status: PiDevOpsWorkflowFinalState,
  blockers: string[],
  verificationResults: Array<{ command?: string; result?: string }>,
  gates: string[],
): string {
  if (status === 'complete') return gates.includes('finalise') ? 'finalise' : gates.at(-1) ?? 'finalise'
  if (status === 'rolled_back') return 'finalise'
  if (status === 'blocked') {
    if (blockers.length > 0) return gates.includes('verification') ? 'verification' : 'review'
    return gates.includes('connection') ? 'connection' : gates[0] ?? 'intake'
  }
  if (verificationResults.length === 0) return gates.includes('verification') ? 'verification' : gates[0] ?? 'intake'
  return gates.includes('review') ? 'review' : gates.at(-1) ?? 'review'
}

function summarizeVerification(results: Array<{ command?: string; result?: string }>): string {
  if (results.length === 0) return 'No verification evidence recorded yet.'
  return results
    .map((item) => `${item.command ?? 'unknown command'}: ${item.result ?? 'result not recorded'}`)
    .join(' | ')
}

function nextActionFor(status: PiDevOpsWorkflowFinalState, blockers: string[]): string {
  if (status === 'complete') return 'Surface this workflow in Founder OS, then open the next gated build lane.'
  if (status === 'blocked') return `Resolve blocker before moving forward: ${blockers[0] ?? 'blocker evidence required'}`
  if (status === 'rolled_back') return 'Review rollback evidence and decide whether to re-scope the lane.'
  return 'Continue the active gate and record evidence before moving to the next build.'
}
