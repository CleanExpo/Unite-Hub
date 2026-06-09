import { describe, expect, it } from 'vitest'
import {
  ACT_THRESHOLD,
  VERIFY_THRESHOLD,
  brierScore,
  calculateCoverageRelation,
  classifyHardGate,
  combinedCatchRate,
  decideBoardMove,
  effectiveProbabilityWithRetry,
  endToEndReliability,
  expectedValue,
  rankBoardMoves,
  runFirstBoardDecisionSimulation,
  type BoardMoveCandidate,
} from '../board-decision'

const localMove: BoardMoveCandidate = {
  moveId: 'local-contract-tests',
  objective: 'Add local contract tests for Board Decision Engine',
  projectId: 'unite_hub_nexus_mission_control',
  pSuccess: 0.92,
  valueScore: 8,
  failureCost: 1,
  reversibility: 'reversible',
  hardGate: 'none',
  verificationAvailable: true,
  retryCount: 2,
  calibratedConfidence: 0.9,
  coverageDelta: 0.04,
  evidenceRequired: ['focused_tests', 'type_check'],
}

describe('Board Decision Mathematics Engine', () => {
  it('calculates chain reliability p^n', () => {
    expect(endToEndReliability(0.9, 15)).toBeCloseTo(0.205891, 6)
  })

  it('calculates retry effective probability', () => {
    expect(effectiveProbabilityWithRetry(0.9, 2)).toBeCloseTo(0.999, 6)
  })

  it('calculates independent reviewer combined catch rate', () => {
    expect(combinedCatchRate([0.8, 0.8])).toBeCloseTo(0.96, 6)
  })

  it('calculates expected value', () => {
    expect(expectedValue(localMove)).toBeCloseTo(7.28, 6)
  })

  it('hard-gates irreversible deploy/payment/publish/email/production moves regardless of EV', () => {
    const deploy = decideBoardMove({
      ...localMove,
      moveId: 'deploy-live',
      objective: 'Deploy live product',
      pSuccess: 0.95,
      valueScore: 10,
      failureCost: 8,
      reversibility: 'irreversible',
      hardGate: 'deploy',
    })

    expect(deploy.decision).toBe('blocked_by_hard_gate')
    expect(deploy.humanApprovalRequired).toBe(true)
    expect(deploy.expectedValue).toBeGreaterThan(0)
    expect(deploy.hardGateBypassed).toBe(false)
  })

  it('rejects negative expected value', () => {
    const result = decideBoardMove({ ...localMove, pSuccess: 0.1, valueScore: 2, failureCost: 10 })

    expect(result.decision).toBe('reject_negative_ev')
    expect(result.humanApprovalRequired).toBe(false)
  })

  it('uses verify-first threshold for medium-confidence reversible moves', () => {
    const result = decideBoardMove({ ...localMove, pSuccess: 0.7, calibratedConfidence: 0.7 })

    expect(VERIFY_THRESHOLD).toBe(0.55)
    expect(result.decision).toBe('verify_first')
    expect(result.verificationPlan.required).toBe(true)
  })

  it('uses act-now threshold for high-confidence reversible verified moves', () => {
    const result = decideBoardMove(localMove)

    expect(ACT_THRESHOLD).toBe(0.85)
    expect(result.decision).toBe('act_now')
    expect(result.humanApprovalRequired).toBe(false)
  })

  it('calculates Brier score for calibration', () => {
    expect(brierScore([
      { predicted: 0.9, outcome: 1 },
      { predicted: 0.6, outcome: 0 },
      { predicted: 0.7, outcome: 1 },
    ])).toBeCloseTo((0.01 + 0.36 + 0.09) / 3, 6)
  })

  it('calculates coverage target relation', () => {
    const relation = calculateCoverageRelation({ verifiedRequirements: 49, totalRequirements: 50, targetCoverage: 0.98 })

    expect(relation.coverage).toBeCloseTo(0.98, 6)
    expect(relation.targetMet).toBe(true)
    expect(relation.remainingRequirements).toBe(1)
  })

  it('does not bypass hard gates even when ranking safe work', () => {
    const ranked = rankBoardMoves([
      { ...localMove, moveId: 'production-migration', objective: 'Run production migration', hardGate: 'production_db', reversibility: 'irreversible', pSuccess: 0.95, valueScore: 99 },
      { ...localMove, moveId: 'safe-local-work', objective: 'Safe local implementation', pSuccess: 0.9, valueScore: 12, failureCost: 1 },
    ])

    expect(ranked[0].moveId).toBe('safe-local-work')
    expect(ranked.find((move) => move.moveId === 'production-migration')?.decision).toBe('blocked_by_hard_gate')
    expect(ranked.every((move) => move.hardGateBypassed === false)).toBe(true)
  })

  it('classifies blocked OP and external execution lanes as non-autonomous', () => {
    expect(classifyHardGate('BLOCKED-OP sandbox voice lane')).toBe('blocked_op')
    expect(classifyHardGate('Enable live external execution bridge')).toBe('external_execution')
  })

  it('runs the first simulation with safe local work ranked and hard gates escalated', () => {
    const simulation = runFirstBoardDecisionSimulation()

    expect(simulation.externalExecutionEnabled).toBe(false)
    expect(simulation.hardGatesBypassed).toBe(0)
    expect(simulation.scoredMoves.length).toBeGreaterThanOrEqual(7)
    expect(simulation.nextRecommendedMove.moveId).toBe('product_factory_composer')
    expect(simulation.scoredMoves.find((move) => move.moveId === 'production_migration')?.decision).toBe('blocked_by_hard_gate')
    expect(simulation.scoredMoves.find((move) => move.moveId === 'deploy_live_action')?.decision).toBe('blocked_by_hard_gate')
    expect(simulation.scoredMoves.find((move) => move.moveId === 'blocked_op_sandbox_voice_lane')?.decision).toBe('blocked_by_hard_gate')
    expect(simulation.scoredMoves.find((move) => move.moveId === 'claude_cursor_lane_install')?.decision).toBe('verify_first')
  })
})
