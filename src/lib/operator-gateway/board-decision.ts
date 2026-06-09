export const ACT_THRESHOLD = 0.85
export const VERIFY_THRESHOLD = 0.55
export const CALIBRATION_THRESHOLD = 0.25
export const DEFAULT_COVERAGE_TARGET = 0.98

export type BoardDecisionState =
  | 'act_now'
  | 'verify_first'
  | 'escalate_to_board'
  | 'blocked_by_hard_gate'
  | 'reject_negative_ev'
  | 'needs_research'
  | 'needs_calibration'

export type HardGateClassification =
  | 'none'
  | 'deploy'
  | 'payment'
  | 'email'
  | 'publish'
  | 'production_db'
  | 'delete'
  | 'claims_orders'
  | 'blocked_op'
  | 'external_execution'
  | 'secrets'
  | 'browser_or_computer_use'

export interface BoardMoveCandidate {
  moveId: string
  objective: string
  projectId: string
  pSuccess: number
  valueScore: number
  failureCost: number
  reversibility: 'reversible' | 'irreversible'
  hardGate: HardGateClassification
  verificationAvailable: boolean
  retryCount: number
  calibratedConfidence: number
  coverageDelta: number
  evidenceRequired: string[]
}

export interface VerificationPlan {
  required: boolean
  retryCount: number
  effectiveProbability: number
  independentCatchRate: number
  evidenceRequired: string[]
  notes: string[]
}

export interface BoardDecisionResult {
  moveId: string
  objective: string
  projectId: string
  pSuccess: number
  valueScore: number
  failureCost: number
  expectedValue: number
  reversibility: BoardMoveCandidate['reversibility']
  hardGate: HardGateClassification
  verificationAvailable: boolean
  retryCount: number
  calibratedConfidence: number
  coverageDelta: number
  decision: BoardDecisionState
  evidenceRequired: string[]
  verificationPlan: VerificationPlan
  humanApprovalRequired: boolean
  hardGateBypassed: false
  rankScore: number
  reason: string
}

export interface CalibrationRecord {
  predicted: number
  outcome: 0 | 1
}

export interface CoverageRelation {
  verifiedRequirements: number
  totalRequirements: number
  targetCoverage: number
  coverage: number
  targetMet: boolean
  remainingRequirements: number
}

export interface BoardDecisionSimulation {
  status: 'local_decision_engine_ready'
  source: 'deterministic_local_engine'
  candidateMovesScored: number
  nextRecommendedMove: BoardDecisionResult
  scoredMoves: BoardDecisionResult[]
  hardGatesDetected: number
  hardGatesBypassed: 0
  verifyFirstMoves: number
  coverageTarget: number
  calibrationStatus: 'supported'
  externalExecutionEnabled: false
  marketLaunchActionDisabled: true
  humanApprovalRequiredForIrreversible: true
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function endToEndReliability(pStep: number, nSteps: number): number {
  return Math.pow(clampProbability(pStep), Math.max(0, nSteps))
}

export function effectiveProbabilityWithRetry(pStep: number, retries: number): number {
  const attempts = Math.max(1, retries + 1)
  return 1 - Math.pow(1 - clampProbability(pStep), attempts)
}

export function combinedCatchRate(catchRates: number[]): number {
  const miss = catchRates.reduce((product, rate) => product * (1 - clampProbability(rate)), 1)
  return 1 - miss
}

export function brierScore(records: CalibrationRecord[]): number {
  if (records.length === 0) return Number.NaN
  return records.reduce((sum, record) => sum + Math.pow(clampProbability(record.predicted) - record.outcome, 2), 0) / records.length
}

export function expectedValue(move: Pick<BoardMoveCandidate, 'pSuccess' | 'valueScore' | 'failureCost'>): number {
  const p = clampProbability(move.pSuccess)
  return p * move.valueScore - (1 - p) * move.failureCost
}

export function calculateCoverageRelation(input: {
  verifiedRequirements: number
  totalRequirements: number
  targetCoverage?: number
}): CoverageRelation {
  const totalRequirements = Math.max(0, input.totalRequirements)
  const verifiedRequirements = Math.min(Math.max(0, input.verifiedRequirements), totalRequirements)
  const targetCoverage = input.targetCoverage ?? DEFAULT_COVERAGE_TARGET
  const coverage = totalRequirements === 0 ? 0 : verifiedRequirements / totalRequirements
  return {
    verifiedRequirements,
    totalRequirements,
    targetCoverage,
    coverage,
    targetMet: coverage >= targetCoverage,
    remainingRequirements: Math.max(0, totalRequirements - verifiedRequirements),
  }
}

export function classifyHardGate(objective: string): HardGateClassification {
  const text = objective.toLowerCase()
  if (text.includes('blocked-op') || text.includes('1password') || text.includes('op auth')) return 'blocked_op'
  if (text.includes('deploy') || text.includes('live action') || text.includes('go-live')) return 'deploy'
  if (text.includes('stripe') || text.includes('payment') || text.includes('charge')) return 'payment'
  if (text.includes('email')) return 'email'
  if (text.includes('publish') || text.includes('public')) return 'publish'
  if (text.includes('production migration') || text.includes('production db') || text.includes('prod db')) return 'production_db'
  if (text.includes('delete') || text.includes('destructive')) return 'delete'
  if (text.includes('claim') || text.includes('order')) return 'claims_orders'
  if (text.includes('external execution') || text.includes('live runner')) return 'external_execution'
  if (text.includes('secret') || text.includes('api key')) return 'secrets'
  if (text.includes('browser automation') || text.includes('computer use')) return 'browser_or_computer_use'
  return 'none'
}

function isHardGated(move: BoardMoveCandidate): boolean {
  return move.reversibility === 'irreversible' || move.hardGate !== 'none'
}

export function decideBoardMove(move: BoardMoveCandidate): BoardDecisionResult {
  const ev = expectedValue(move)
  const effectiveProbability = effectiveProbabilityWithRetry(move.pSuccess, move.retryCount)
  const independentCatchRate = combinedCatchRate(move.verificationAvailable ? [0.8, 0.8] : [])
  const verificationPlan: VerificationPlan = {
    required: false,
    retryCount: move.retryCount,
    effectiveProbability,
    independentCatchRate,
    evidenceRequired: move.evidenceRequired,
    notes: [],
  }

  let decision: BoardDecisionState
  let humanApprovalRequired = false
  let reason: string

  if (isHardGated(move)) {
    decision = 'blocked_by_hard_gate'
    humanApprovalRequired = true
    verificationPlan.required = true
    verificationPlan.notes.push('Irreversible or hard-gated move: Board approval required regardless of expected value.')
    reason = `hard gate ${move.hardGate} overrides EV ${ev.toFixed(2)}`
  } else if (move.calibratedConfidence < VERIFY_THRESHOLD) {
    decision = 'needs_calibration'
    verificationPlan.required = true
    verificationPlan.notes.push('Confidence is below calibrated operating threshold; gather calibration evidence first.')
    reason = `calibrated confidence ${move.calibratedConfidence.toFixed(2)} below ${VERIFY_THRESHOLD}`
  } else if (ev <= 0) {
    decision = 'reject_negative_ev'
    reason = `expected value ${ev.toFixed(2)} is not positive`
  } else if (move.pSuccess >= ACT_THRESHOLD && move.verificationAvailable) {
    decision = 'act_now'
    reason = `positive EV ${ev.toFixed(2)} and calibrated p ${move.pSuccess.toFixed(2)} >= ${ACT_THRESHOLD}`
  } else if (move.pSuccess >= VERIFY_THRESHOLD && move.verificationAvailable) {
    decision = 'verify_first'
    verificationPlan.required = true
    verificationPlan.notes.push('Run verification to raise confidence before acting.')
    reason = `positive EV ${ev.toFixed(2)} but p ${move.pSuccess.toFixed(2)} is below act threshold`
  } else if (move.verificationAvailable) {
    decision = 'needs_research'
    verificationPlan.required = true
    reason = `p ${move.pSuccess.toFixed(2)} below verify threshold; research before execution`
  } else {
    decision = 'escalate_to_board'
    humanApprovalRequired = true
    reason = 'no verifier available; Board escalation required'
  }

  return {
    moveId: move.moveId,
    objective: move.objective,
    projectId: move.projectId,
    pSuccess: clampProbability(move.pSuccess),
    valueScore: move.valueScore,
    failureCost: move.failureCost,
    expectedValue: Number(ev.toFixed(4)),
    reversibility: move.reversibility,
    hardGate: move.hardGate,
    verificationAvailable: move.verificationAvailable,
    retryCount: move.retryCount,
    calibratedConfidence: clampProbability(move.calibratedConfidence),
    coverageDelta: move.coverageDelta,
    decision,
    evidenceRequired: move.evidenceRequired,
    verificationPlan,
    humanApprovalRequired,
    hardGateBypassed: false,
    rankScore: Number((decision === 'blocked_by_hard_gate' ? -1000 + ev : ev + move.coverageDelta * 100).toFixed(4)),
    reason,
  }
}

export function rankBoardMoves(moves: BoardMoveCandidate[]): BoardDecisionResult[] {
  return moves.map(decideBoardMove).sort((a, b) => b.rankScore - a.rankScore)
}

export function getFirstSimulationCandidates(): BoardMoveCandidate[] {
  return [
    {
      moveId: 'product_factory_composer',
      objective: 'Build Product Factory Composer from capability registry',
      projectId: 'unite_group_nexus_mission_control',
      pSuccess: 0.91,
      valueScore: 14,
      failureCost: 2,
      reversibility: 'reversible',
      hardGate: 'none',
      verificationAvailable: true,
      retryCount: 2,
      calibratedConfidence: 0.9,
      coverageDelta: 0.08,
      evidenceRequired: ['capability_registry_read', 'mapped_product_plan', 'focused_tests'],
    },
    {
      moveId: 'carsi_dod_gap_closure',
      objective: 'Close CARSI DoD gaps with local evidence and tests',
      projectId: 'carsi',
      pSuccess: 0.86,
      valueScore: 10,
      failureCost: 2,
      reversibility: 'reversible',
      hardGate: 'none',
      verificationAvailable: true,
      retryCount: 2,
      calibratedConfidence: 0.86,
      coverageDelta: 0.06,
      evidenceRequired: ['dod_probe', 'coverage_check'],
    },
    {
      moveId: 'continuous_ops_clean_branch_packaging',
      objective: 'Package Continuous Ops clean branch and PR evidence',
      projectId: 'agentic_nexus',
      pSuccess: 0.96,
      valueScore: 7,
      failureCost: 1,
      reversibility: 'reversible',
      hardGate: 'none',
      verificationAvailable: true,
      retryCount: 1,
      calibratedConfidence: 0.94,
      coverageDelta: 0.03,
      evidenceRequired: ['git_diff_check', 'focused_tests', 'pr_created'],
    },
    {
      moveId: 'claude_cursor_lane_install',
      objective: 'Prepare Claude/Cursor lane install packet',
      projectId: 'operator_gateway',
      pSuccess: 0.72,
      valueScore: 8,
      failureCost: 3,
      reversibility: 'reversible',
      hardGate: 'none',
      verificationAvailable: true,
      retryCount: 1,
      calibratedConfidence: 0.72,
      coverageDelta: 0.04,
      evidenceRequired: ['operator_install_checklist', 'no_credentials_stored'],
    },
    {
      moveId: 'blocked_op_sandbox_voice_lane',
      objective: 'BLOCKED-OP sandbox voice lane remains blocked until 1Password auth is green',
      projectId: 'sandbox_voice_migration',
      pSuccess: 0.8,
      valueScore: 9,
      failureCost: 8,
      reversibility: 'irreversible',
      hardGate: 'blocked_op',
      verificationAvailable: true,
      retryCount: 0,
      calibratedConfidence: 0.8,
      coverageDelta: 0,
      evidenceRequired: ['op_auth_green_before_action'],
    },
    {
      moveId: 'production_migration',
      objective: 'Run production migration',
      projectId: 'operator_gateway',
      pSuccess: 0.95,
      valueScore: 15,
      failureCost: 15,
      reversibility: 'irreversible',
      hardGate: 'production_db',
      verificationAvailable: true,
      retryCount: 0,
      calibratedConfidence: 0.92,
      coverageDelta: 0.1,
      evidenceRequired: ['explicit_board_approval', 'sandbox_green'],
    },
    {
      moveId: 'deploy_live_action',
      objective: 'Deploy/live action',
      projectId: 'unite_hub',
      pSuccess: 0.95,
      valueScore: 12,
      failureCost: 10,
      reversibility: 'irreversible',
      hardGate: 'deploy',
      verificationAvailable: true,
      retryCount: 0,
      calibratedConfidence: 0.93,
      coverageDelta: 0.05,
      evidenceRequired: ['explicit_board_go_no_go'],
    },
  ]
}

export function runFirstBoardDecisionSimulation(): BoardDecisionSimulation {
  const scoredMoves = rankBoardMoves(getFirstSimulationCandidates())
  const nextRecommendedMove = scoredMoves.find((move) => move.decision === 'act_now') ?? scoredMoves[0]
  return {
    status: 'local_decision_engine_ready',
    source: 'deterministic_local_engine',
    candidateMovesScored: scoredMoves.length,
    nextRecommendedMove,
    scoredMoves,
    hardGatesDetected: scoredMoves.filter((move) => move.decision === 'blocked_by_hard_gate').length,
    hardGatesBypassed: 0,
    verifyFirstMoves: scoredMoves.filter((move) => move.decision === 'verify_first').length,
    coverageTarget: DEFAULT_COVERAGE_TARGET,
    calibrationStatus: 'supported',
    externalExecutionEnabled: false,
    marketLaunchActionDisabled: true,
    humanApprovalRequiredForIrreversible: true,
  }
}
