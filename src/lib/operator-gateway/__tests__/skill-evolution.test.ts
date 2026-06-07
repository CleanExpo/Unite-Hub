import { describe, expect, it } from 'vitest'
import {
  evaluateSkillPromotionGate,
  getSkillEvolutionGraders,
  getSkillEvolutionRegistry,
  getSkillEvolutionStatus,
  getSkillPromptVersions,
} from '../skill-evolution'

describe('self-evolving skill mesh foundation', () => {
  it('loads local skill evolution records without API-key mode or auto-promotion', () => {
    const records = getSkillEvolutionRegistry()

    expect(records.length).toBeGreaterThanOrEqual(10)
    expect(records.map((record) => record.skillId)).toEqual(expect.arrayContaining([
      'senior_project_manager_autopilot',
      'board_strategy_council',
      'research_intelligence',
      'senior_devops',
    ]))
    expect(records.every((record) => record.productionGateRequired === true)).toBe(true)
    expect(records.every((record) => record.externalEvalApiCalled === false)).toBe(true)
    expect(records.every((record) => record.apiKeyMode === false)).toBe(true)
    expect(records.every((record) => record.liveAutoPromotionEnabled === false)).toBe(true)
    expect(records.some((record) => record.promotionStatus === 'candidate_ready')).toBe(true)
    expect(records.some((record) => record.promotionStatus === 'blocked_human_gate')).toBe(true)
  })

  it('loads grader templates with threshold and human-review safety metadata', () => {
    const graders = getSkillEvolutionGraders()

    expect(graders).toHaveLength(10)
    expect(graders.map((grader) => grader.graderId)).toEqual(expect.arrayContaining([
      'senior_pm_next_action_quality',
      'board_risk_review_quality',
      'research_citation_quality',
      'devops_validation_completeness',
      'security_gate_compliance',
      'dashboard_update_quality',
    ]))
    expect(graders.every((grader) => grader.scoringRange.min === 0 && grader.scoringRange.max === 1)).toBe(true)
    expect(graders.every((grader) => grader.passThreshold >= 0.8)).toBe(true)
    expect(graders.every((grader) => grader.safeAutomatedUse.includes('local'))).toBe(true)
  })

  it('tracks prompt versions with rollback-safe candidate shape', () => {
    const versions = getSkillPromptVersions()
    const seniorPm = versions.find((version) => version.skillId === 'senior_project_manager_autopilot')

    expect(seniorPm).toMatchObject({
      skillId: 'senior_project_manager_autopilot',
      currentVersion: 'spm-autopilot-v1',
      candidateVersion: 'spm-autopilot-v1.1-local-eval',
      rollbackVersion: 'spm-autopilot-v1',
      candidateLive: false,
      productionMutationAllowed: false,
    })
    expect(seniorPm?.rollbackAvailable).toBe(true)
    expect(seniorPm?.promotionGateRequired).toBe(true)
  })

  it('refuses promotion when score is below threshold', () => {
    const decision = evaluateSkillPromotionGate({
      latestScore: 0.79,
      passThreshold: 0.85,
      humanGateRequired: false,
      productionGateRequired: true,
      liveAutoPromotionEnabled: false,
    })

    expect(decision.allowed).toBe(false)
    expect(decision.status).toBe('refused_below_threshold')
    expect(decision.reasons).toContain('latest score is below pass threshold')
    expect(decision.productionMutationAllowed).toBe(false)
  })

  it('refuses promotion when human or production gate is required', () => {
    const decision = evaluateSkillPromotionGate({
      latestScore: 0.93,
      passThreshold: 0.85,
      humanGateRequired: true,
      productionGateRequired: true,
      liveAutoPromotionEnabled: false,
    })

    expect(decision.allowed).toBe(false)
    expect(decision.status).toBe('refused_human_gate_required')
    expect(decision.reasons).toEqual(expect.arrayContaining([
      'human review gate is required',
      'production promotion gate is required',
      'live auto-promotion is disabled',
    ]))
  })

  it('reports dashboard-ready status with no external evals and no production auto-promotion', () => {
    const status = getSkillEvolutionStatus()

    expect(status.source).toBe('static_local_evolution_registry')
    expect(status.status).toBe('local_foundation_ready')
    expect(status.skillsUnderEvaluation).toBeGreaterThanOrEqual(10)
    expect(status.gradersDefined).toBe(10)
    expect(status.promotionCandidates).toBeGreaterThanOrEqual(1)
    expect(status.blockedPromotions).toBeGreaterThanOrEqual(1)
    expect(status.noApiKeyMode).toBe(true)
    expect(status.externalEvalApiCalled).toBe(false)
    expect(status.liveAutoPromotionEnabled).toBe(false)
    expect(status.productionDbTouched).toBe(false)
    expect(status.nextRecommendedSkillToEvaluate).toBe('senior_project_manager_autopilot')
  })
})
