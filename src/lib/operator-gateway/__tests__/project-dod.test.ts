import { describe, expect, it } from 'vitest'
import {
  calculateProjectCoverage,
  emitMissingRequirementJobs,
  getProjectDodCoverageStatus,
  getProjectDodRegistry,
  judgeProjectCompletion,
  validateProjectDodRegistry,
  type ProjectRequirement,
} from '../project-dod'

describe('project Definition of Done coverage reconciler', () => {
  it('loads at least four project DoD specs with 10-25 machine-checkable requirements each', () => {
    const registry = getProjectDodRegistry()

    expect(registry.length).toBeGreaterThanOrEqual(4)
    expect(registry.map((project) => project.projectId)).toEqual(expect.arrayContaining([
      'unite_hub_nexus_mission_control',
      'restoreassist',
      'carsi',
      'agentic_nexus_pi_dev_ops',
    ]))

    for (const project of registry) {
      expect(project.requirements.length).toBeGreaterThanOrEqual(10)
      expect(project.requirements.length).toBeLessThanOrEqual(25)
      expect(project.completionThreshold).toBeGreaterThanOrEqual(0.9)
      expect(project.falseDonePreventionActive).toBe(true)
      for (const requirement of project.requirements) {
        expect(requirement.requirementId).toMatch(/^req-/)
        expect(requirement.projectId).toBe(project.projectId)
        expect(requirement.description.length).toBeGreaterThan(20)
        expect(requirement.probeCommandOrCheck.length).toBeGreaterThan(0)
        expect(requirement.evidenceRequired.length).toBeGreaterThan(0)
      }
    }
  })

  it('validates required requirement schema fields', () => {
    const registry = getProjectDodRegistry()
    const validation = validateProjectDodRegistry(registry)

    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('computes coverage and refuses project done when a critical requirement fails', () => {
    const requirements: ProjectRequirement[] = [
      requirement('req-critical-pass', true, true),
      requirement('req-critical-fail', true, false),
      requirement('req-normal-pass', false, true),
    ]

    const coverage = calculateProjectCoverage({
      projectId: 'unit_test_project',
      projectName: 'Unit Test Project',
      ownerRole: 'Founder / Board',
      approverRole: 'Founder / Board',
      completionThreshold: 0.9,
      falseDonePreventionActive: true,
      requirements,
    })
    const judgement = judgeProjectCompletion(coverage)

    expect(coverage.totalRequirements).toBe(3)
    expect(coverage.passedRequirements).toBe(2)
    expect(coverage.coveragePercent).toBe(67)
    expect(coverage.failedHardGateCount).toBe(1)
    expect(judgement.projectDone).toBe(false)
    expect(judgement.status).toBe('not_done_failed_hard_gate')
    expect(judgement.falseDonePrevented).toBe(true)
  })

  it('marks project done only when hard gates pass and threshold is met', () => {
    const requirements: ProjectRequirement[] = [
      requirement('req-critical-pass-a', true, true),
      requirement('req-critical-pass-b', true, true),
      requirement('req-normal-pass', false, true),
      requirement('req-normal-blocked', false, false, 'blocked'),
    ]

    const coverage = calculateProjectCoverage({
      projectId: 'unit_test_project',
      projectName: 'Unit Test Project',
      ownerRole: 'Founder / Board',
      approverRole: 'Founder / Board',
      completionThreshold: 0.75,
      falseDonePreventionActive: true,
      requirements,
    })

    expect(judgeProjectCompletion(coverage).projectDone).toBe(true)
    expect(judgeProjectCompletion(coverage).status).toBe('project_done_coverage_green')
  })

  it('emits Senior PM next-action jobs from uncovered requirements ranked by gate and priority', () => {
    const requirements: ProjectRequirement[] = [
      requirement('req-low', false, false, 'missing', 'P2'),
      requirement('req-hard', true, false, 'missing', 'P1'),
      requirement('req-pass', true, true, 'passed', 'P0'),
    ]
    const coverage = calculateProjectCoverage({
      projectId: 'unit_test_project',
      projectName: 'Unit Test Project',
      ownerRole: 'Founder / Board',
      approverRole: 'Founder / Board',
      completionThreshold: 0.9,
      falseDonePreventionActive: true,
      requirements,
    })

    const jobs = emitMissingRequirementJobs(coverage)

    expect(jobs.map((job) => job.requirementId)).toEqual(['req-hard', 'req-low'])
    expect(jobs[0].title).toContain('Close DoD gap')
    expect(jobs[0].seniorPmRank).toBe(1)
    expect(jobs[0].blockedByBoardGate).toBe(true)
  })

  it('returns Mission Control status with visible coverage and false-done prevention active', () => {
    const status = getProjectDodCoverageStatus()

    expect(status.source).toBe('static_local_project_dod_registry')
    expect(status.status).toBe('local_foundation_ready')
    expect(status.falseDonePreventionActive).toBe(true)
    expect(status.productionDbTouched).toBe(false)
    expect(status.deploymentOccurred).toBe(false)
    expect(status.projectsWithDodSpecs).toBeGreaterThanOrEqual(4)
    expect(status.projects.some((project) => project.missingRequirements.length > 0)).toBe(true)
    expect(status.nextProjectToReconcile.projectId).toBeTruthy()
    expect(status.nextGeneratedJobs.map((job) => job.globalRank)).toEqual(status.nextGeneratedJobs.map((_, index) => index + 1))
  })

  it('rejects invalid runtime registry enum values', () => {
    const registry = getProjectDodRegistry()
    const invalidProject = {
      ...registry[0],
      requirements: [{ ...registry[0].requirements[0], probeType: 'shell_exec' as ProjectRequirement['probeType'] }],
    }

    const validation = validateProjectDodRegistry([invalidProject])

    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain(`${invalidProject.projectId}/${invalidProject.requirements[0].requirementId}: probeType invalid`)
  })

  it('refuses project completion when false-done prevention is disabled', () => {
    const coverage = calculateProjectCoverage({
      projectId: 'unit_test_project',
      projectName: 'Unit Test Project',
      ownerRole: 'Founder / Board',
      approverRole: 'Founder / Board',
      completionThreshold: 0.5,
      falseDonePreventionActive: false,
      requirements: [requirement('req-pass-a', true, true), requirement('req-pass-b', false, true)],
    })

    expect(coverage.projectDone).toBe(false)
    expect(coverage.falseDonePrevented).toBe(true)
    expect(coverage.judgementStatus).toBe('not_done_false_done_guard_disabled')
  })

  it('treats absolute host paths as missing instead of probing outside the allowed roots', () => {
    const coverage = calculateProjectCoverage({
      projectId: 'unit_test_project',
      projectName: 'Unit Test Project',
      ownerRole: 'Founder / Board',
      approverRole: 'Founder / Board',
      completionThreshold: 1,
      falseDonePreventionActive: true,
      requirements: [{ ...requirement('req-absolute-path', true, true), probeType: 'file_exists', probeCommandOrCheck: '/etc/passwd' }],
    })

    expect(coverage.passedRequirements).toBe(0)
    expect(coverage.failedHardGateCount).toBe(1)
    expect(coverage.missingRequirements[0].probeCommandOrCheck).toBe('/etc/passwd')
    expect(coverage.projectDone).toBe(false)
  })

  it('preserves declared failed requirement status in probe output', () => {
    const coverage = calculateProjectCoverage({
      projectId: 'unit_test_project',
      projectName: 'Unit Test Project',
      ownerRole: 'Founder / Board',
      approverRole: 'Founder / Board',
      completionThreshold: 1,
      falseDonePreventionActive: true,
      requirements: [{ ...requirement('req-failed-status', false, false, 'failed'), probeType: 'unknown' as ProjectRequirement['probeType'] }],
    })

    expect(coverage.missingRequirements[0].probeResult).toBe('failed')
  })

  it('treats disconnected static boolean probes as not connected rather than synthetic pass states', () => {
    const coverage = calculateProjectCoverage({
      projectId: 'unit_test_project',
      projectName: 'Unit Test Project',
      ownerRole: 'Founder / Board',
      approverRole: 'Founder / Board',
      completionThreshold: 1,
      falseDonePreventionActive: true,
      requirements: [{ ...requirement('req-static-disconnected', true, true), probeType: 'static_boolean', probeCommandOrCheck: 'no_prod_db_no_deploy' }],
    })

    expect(coverage.passedRequirements).toBe(0)
    expect(coverage.missingRequirements[0].evidence[0]).toContain('not_connected:static_boolean:no_prod_db_no_deploy')
  })
})

function requirement(
  requirementId: string,
  hardGate: boolean,
  pass: boolean,
  status: ProjectRequirement['status'] = pass ? 'passed' : 'missing',
  priority: ProjectRequirement['priority'] = 'P1',
): ProjectRequirement {
  return {
    requirementId,
    projectId: 'unit_test_project',
    category: 'test_check',
    description: `Requirement ${requirementId} must be independently checkable before the project is done.`,
    probeType: 'file_exists',
    probeCommandOrCheck: pass ? 'project_dod_registry.jsonl' : 'missing-unit-test-artifact.json',
    passCondition: pass ? 'local file probe passes' : 'local file probe misses',
    evidenceRequired: ['coverage result evidence'],
    priority,
    ownerRole: 'Senior PM',
    hardGate,
    status,
  }
}
