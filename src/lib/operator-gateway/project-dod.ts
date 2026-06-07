import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

export type ProjectRequirementProbeType =
  | 'file_exists'
  | 'route_exists'
  | 'test_exists'
  | 'dashboard_artifact_exists'
  | 'schema_exists'
  | 'docs_artifact_exists'
  | 'static_boolean'

export type ProjectRequirementCategory =
  | 'capability_check'
  | 'surface_check'
  | 'route_check'
  | 'schema_check'
  | 'integration_check'
  | 'test_check'
  | 'deployment_check'
  | 'evidence_check'
  | 'dashboard_check'
  | 'business_readiness_check'
  | 'owner_approver_check'

export type ProjectRequirementStatus = 'planned' | 'missing' | 'blocked' | 'passed' | 'failed' | 'not_applicable'
export type ProjectRequirementPriority = 'P0' | 'P1' | 'P2' | 'P3'

export interface ProjectRequirement {
  requirementId: string
  projectId: string
  category: ProjectRequirementCategory
  description: string
  probeType: ProjectRequirementProbeType
  probeCommandOrCheck: string
  passCondition: string
  evidenceRequired: string[]
  priority: ProjectRequirementPriority
  ownerRole: string
  hardGate: boolean
  status: ProjectRequirementStatus
}

export interface ProjectDefinitionOfDone {
  projectId: string
  projectName: string
  ownerRole: string
  approverRole: string
  completionThreshold: number
  falseDonePreventionActive: boolean
  requirements: ProjectRequirement[]
}

interface RawProjectRequirement {
  requirement_id: string
  project_id: string
  category: ProjectRequirementCategory
  description: string
  probe_type: ProjectRequirementProbeType
  probe_command_or_check: string
  pass_condition: string
  evidence_required: string[]
  priority: ProjectRequirementPriority
  owner_role: string
  hard_gate: boolean
  status: ProjectRequirementStatus
}

interface RawProjectDefinitionOfDone {
  project_id: string
  project_name: string
  owner_role: string
  approver_role: string
  completion_threshold: number
  false_done_prevention_active: boolean
  requirements: RawProjectRequirement[]
}

export interface RequirementProbeResult extends ProjectRequirement {
  passed: boolean
  evidence: string[]
  probeResult: 'passed' | 'missing' | 'blocked' | 'failed' | 'not_applicable'
}

export interface ProjectCoverageResult {
  projectId: string
  projectName: string
  ownerRole: string
  approverRole: string
  completionThreshold: number
  coveragePercent: number
  totalRequirements: number
  passedRequirements: number
  missingRequirements: RequirementProbeResult[]
  blockedRequirements: RequirementProbeResult[]
  failedHardGateCount: number
  projectDone: boolean
  falseDonePreventionActive: boolean
  falseDonePrevented: boolean
  judgementStatus:
    | 'project_done_coverage_green'
    | 'not_done_failed_hard_gate'
    | 'not_done_below_threshold'
    | 'not_done_false_done_guard_disabled'
  nextGeneratedJobs: MissingRequirementJob[]
  requirements: RequirementProbeResult[]
}

export interface MissingRequirementJob {
  jobId: string
  projectId: string
  requirementId: string
  priority: ProjectRequirementPriority
  title: string
  nextAction: string
  evidenceRequired: string[]
  seniorPmRank: number
  globalRank?: number
  blockedByBoardGate: boolean
}

export interface ProjectCompletionJudgement {
  projectDone: boolean
  status: ProjectCoverageResult['judgementStatus']
  falseDonePrevented: boolean
}

export interface ProjectDodCoverageStatus {
  source: 'static_local_project_dod_registry'
  status: 'local_foundation_ready'
  coverageReconcilerBuilt: true
  founderOnly: true
  falseDonePreventionActive: true
  projectsWithDodSpecs: number
  requirementCount: number
  averageCoveragePercent: number
  projectDoneCount: number
  blockedRequirementCount: number
  missingRequirementCount: number
  nextProjectToReconcile: { projectId: string; projectName: string; coveragePercent: number }
  nextGeneratedJobs: MissingRequirementJob[]
  projects: ProjectCoverageResult[]
  productionDbTouched: false
  deploymentOccurred: false
  externalExecutionEnabled: false
  browserAutomation: false
  computerUse: false
}

const REPO_ROOT = process.cwd()
const REGISTRY_PATH = join(REPO_ROOT, 'project_dod_registry.jsonl')

const VALID_CATEGORIES: ProjectRequirementCategory[] = [
  'capability_check',
  'surface_check',
  'route_check',
  'schema_check',
  'integration_check',
  'test_check',
  'deployment_check',
  'evidence_check',
  'dashboard_check',
  'business_readiness_check',
  'owner_approver_check',
]
const VALID_PROBE_TYPES: ProjectRequirementProbeType[] = [
  'file_exists',
  'route_exists',
  'test_exists',
  'dashboard_artifact_exists',
  'schema_exists',
  'docs_artifact_exists',
  'static_boolean',
]
const VALID_PRIORITIES: ProjectRequirementPriority[] = ['P0', 'P1', 'P2', 'P3']
const VALID_STATUSES: ProjectRequirementStatus[] = ['planned', 'passed', 'missing', 'failed', 'blocked', 'not_applicable']

type StaticProbeState = { connected: boolean; value: boolean; source: 'local_static_declared' | 'not_connected' }

const STATIC_BOOLEAN_PROBES: Record<string, StaticProbeState> = {
  no_prod_db_no_deploy: { connected: false, value: false, source: 'not_connected' },
  restoreassist_standalone_posture_documented: { connected: false, value: false, source: 'not_connected' },
  restoreassist_prod_gate_explicit: { connected: false, value: false, source: 'not_connected' },
  carsi_public_launch_gate: { connected: false, value: false, source: 'not_connected' },
  carsi_no_external_side_effects: { connected: false, value: false, source: 'not_connected' },
  carsi_owner_approver_model: { connected: false, value: false, source: 'not_connected' },
  agentic_nexus_no_live_activation: { connected: false, value: false, source: 'not_connected' },
}

export function getProjectDodRegistry(): ProjectDefinitionOfDone[] {
  const text = readFileSync(REGISTRY_PATH, 'utf8')
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeProject(JSON.parse(line) as RawProjectDefinitionOfDone))
}

export function validateProjectDodRegistry(registry: ProjectDefinitionOfDone[] = getProjectDodRegistry()): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const requiredRequirementFields: (keyof ProjectRequirement)[] = [
    'requirementId',
    'projectId',
    'category',
    'description',
    'probeType',
    'probeCommandOrCheck',
    'passCondition',
    'evidenceRequired',
    'priority',
    'ownerRole',
    'hardGate',
    'status',
  ]

  for (const project of registry) {
    if (!project.projectId) errors.push('project_id missing')
    if (!project.projectName) errors.push(`${project.projectId}: project_name missing`)
    if (!project.ownerRole) errors.push(`${project.projectId}: owner_role missing`)
    if (!project.approverRole) errors.push(`${project.projectId}: approver_role missing`)
    if (project.completionThreshold < 0 || project.completionThreshold > 1) errors.push(`${project.projectId}: completion_threshold out of range`)
    if (project.requirements.length < 1) errors.push(`${project.projectId}: requirements missing`)

    for (const requirement of project.requirements) {
      for (const field of requiredRequirementFields) {
        const value = requirement[field]
        if (value === undefined || value === null || value === '') errors.push(`${project.projectId}/${requirement.requirementId}: ${field} missing`)
      }
      if (requirement.projectId !== project.projectId) errors.push(`${project.projectId}/${requirement.requirementId}: project_id mismatch`)
      if (!VALID_CATEGORIES.includes(requirement.category)) errors.push(`${project.projectId}/${requirement.requirementId}: category invalid`)
      if (!VALID_PROBE_TYPES.includes(requirement.probeType)) errors.push(`${project.projectId}/${requirement.requirementId}: probeType invalid`)
      if (!VALID_PRIORITIES.includes(requirement.priority)) errors.push(`${project.projectId}/${requirement.requirementId}: priority invalid`)
      if (!VALID_STATUSES.includes(requirement.status)) errors.push(`${project.projectId}/${requirement.requirementId}: status invalid`)
      if (!Array.isArray(requirement.evidenceRequired) || requirement.evidenceRequired.length === 0) {
        errors.push(`${project.projectId}/${requirement.requirementId}: evidence_required missing`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function calculateProjectCoverage(project: ProjectDefinitionOfDone): ProjectCoverageResult {
  const requirements = project.requirements.map((requirement) => runProbe(requirement))
  const totalRequirements = requirements.length
  const passedRequirements = requirements.filter((requirement) => requirement.passed).length
  const coveragePercent = totalRequirements === 0 ? 0 : Math.round((passedRequirements / totalRequirements) * 100)
  const missingRequirements = requirements.filter((requirement) => requirement.probeResult === 'missing' || requirement.probeResult === 'failed')
  const blockedRequirements = requirements.filter((requirement) => requirement.probeResult === 'blocked')
  const failedHardGateCount = requirements.filter((requirement) => requirement.hardGate && !requirement.passed).length

  const partial: Omit<ProjectCoverageResult, 'projectDone' | 'falseDonePrevented' | 'judgementStatus' | 'nextGeneratedJobs'> = {
    projectId: project.projectId,
    projectName: project.projectName,
    ownerRole: project.ownerRole,
    approverRole: project.approverRole,
    completionThreshold: project.completionThreshold,
    falseDonePreventionActive: project.falseDonePreventionActive,
    coveragePercent,
    totalRequirements,
    passedRequirements,
    missingRequirements,
    blockedRequirements,
    failedHardGateCount,
    requirements,
  }
  const judgement = judgeProjectCompletion(partial)
  const result: ProjectCoverageResult = {
    ...partial,
    projectDone: judgement.projectDone,
    falseDonePrevented: judgement.falseDonePrevented,
    judgementStatus: judgement.status,
    nextGeneratedJobs: [],
  }
  return {
    ...result,
    nextGeneratedJobs: emitMissingRequirementJobs(result),
  }
}

export function judgeProjectCompletion(
  coverage: Pick<ProjectCoverageResult, 'coveragePercent' | 'completionThreshold' | 'failedHardGateCount' | 'falseDonePreventionActive'>,
): ProjectCompletionJudgement {
  if (coverage.falseDonePreventionActive === false) {
    return { projectDone: false, status: 'not_done_false_done_guard_disabled', falseDonePrevented: true }
  }
  if (coverage.failedHardGateCount > 0) {
    return { projectDone: false, status: 'not_done_failed_hard_gate', falseDonePrevented: true }
  }
  if (coverage.coveragePercent < Math.round(coverage.completionThreshold * 100)) {
    return { projectDone: false, status: 'not_done_below_threshold', falseDonePrevented: true }
  }
  return { projectDone: true, status: 'project_done_coverage_green', falseDonePrevented: false }
}

export function emitMissingRequirementJobs(coverage: Pick<ProjectCoverageResult, 'projectId' | 'projectName' | 'missingRequirements' | 'blockedRequirements'>): MissingRequirementJob[] {
  const priorityRank: Record<ProjectRequirementPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
  return [...coverage.missingRequirements, ...coverage.blockedRequirements]
    .sort((a, b) => {
      if (a.hardGate !== b.hardGate) return a.hardGate ? -1 : 1
      const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority]
      if (priorityDelta !== 0) return priorityDelta
      return a.requirementId.localeCompare(b.requirementId)
    })
    .map((requirement, index) => ({
      jobId: `dod-gap-${coverage.projectId}-${requirement.requirementId}`,
      projectId: coverage.projectId,
      requirementId: requirement.requirementId,
      priority: requirement.priority,
      title: `Close DoD gap: ${coverage.projectName}`,
      nextAction: requirement.description,
      evidenceRequired: [...requirement.evidenceRequired],
      seniorPmRank: index + 1,
      blockedByBoardGate: requirement.hardGate,
    }))
}

export function getProjectDodCoverageStatus(): ProjectDodCoverageStatus {
  const projects = getProjectDodRegistry().map((project) => calculateProjectCoverage(project))
  const projectPriority = [...projects]
    .sort((a, b) => {
      if (a.failedHardGateCount !== b.failedHardGateCount) return b.failedHardGateCount - a.failedHardGateCount
      if (a.coveragePercent !== b.coveragePercent) return a.coveragePercent - b.coveragePercent
      return a.projectId.localeCompare(b.projectId)
    })
    .reduce<Record<string, number>>((acc, project, index) => {
      acc[project.projectId] = index + 1
      return acc
    }, {})
  const jobs = projects
    .flatMap((project) => project.nextGeneratedJobs.map((job) => ({
      ...job,
      globalRank: ((projectPriority[project.projectId] ?? projects.length + 1) * 1000) + job.seniorPmRank,
    })))
    .sort((a, b) => a.globalRank - b.globalRank)
    .slice(0, 12)
    .map((job, index) => ({ ...job, globalRank: index + 1 }))
  const nextProject = [...projects].sort((a, b) => a.coveragePercent - b.coveragePercent)[0]
  const requirementCount = projects.reduce((sum, project) => sum + project.totalRequirements, 0)
  const averageCoveragePercent = projects.length === 0
    ? 0
    : Math.round(projects.reduce((sum, project) => sum + project.coveragePercent, 0) / projects.length)

  return {
    source: 'static_local_project_dod_registry',
    status: 'local_foundation_ready',
    coverageReconcilerBuilt: true,
    founderOnly: true,
    falseDonePreventionActive: true,
    projectsWithDodSpecs: projects.length,
    requirementCount,
    averageCoveragePercent,
    projectDoneCount: projects.filter((project) => project.projectDone).length,
    blockedRequirementCount: projects.reduce((sum, project) => sum + project.blockedRequirements.length, 0),
    missingRequirementCount: projects.reduce((sum, project) => sum + project.missingRequirements.length, 0),
    nextProjectToReconcile: {
      projectId: nextProject?.projectId ?? '',
      projectName: nextProject?.projectName ?? '',
      coveragePercent: nextProject?.coveragePercent ?? 0,
    },
    nextGeneratedJobs: jobs,
    projects,
    productionDbTouched: false,
    deploymentOccurred: false,
    externalExecutionEnabled: false,
    browserAutomation: false,
    computerUse: false,
  }
}

function runProbe(requirement: ProjectRequirement): RequirementProbeResult {
  if (requirement.status === 'blocked') return withProbe(requirement, false, 'blocked')
  if (requirement.status === 'not_applicable') return withProbe(requirement, true, 'not_applicable')

  const pathProbeTypes: ProjectRequirementProbeType[] = [
    'file_exists',
    'route_exists',
    'test_exists',
    'dashboard_artifact_exists',
    'schema_exists',
    'docs_artifact_exists',
  ]
  if (pathProbeTypes.includes(requirement.probeType)) {
    const targetPath = resolvePath(requirement.probeCommandOrCheck)
    const pathExists = targetPath === null ? false : existsSync(targetPath)
    return withProbe(requirement, pathExists, pathExists ? 'passed' : 'missing')
  }
  if (requirement.probeType === 'static_boolean') {
    const probe = STATIC_BOOLEAN_PROBES[requirement.probeCommandOrCheck]
    const passed = probe?.connected === true && probe.value === true
    return withProbe(requirement, passed, passed ? 'passed' : 'missing', probe?.source ?? 'not_connected')
  }
  return withProbe(
    requirement,
    requirement.status === 'passed',
    requirement.status === 'passed' ? 'passed' : requirement.status === 'failed' ? 'failed' : 'missing',
  )
}

function withProbe(
  requirement: ProjectRequirement,
  passed: boolean,
  probeResult: RequirementProbeResult['probeResult'],
  probeSource?: StaticProbeState['source'],
): RequirementProbeResult {
  return {
    ...requirement,
    passed,
    probeResult,
    evidence: passed
      ? [`${requirement.probeType}:${requirement.probeCommandOrCheck}`]
      : [`${probeSource ?? 'missing'}:${requirement.probeType}:${requirement.probeCommandOrCheck}`],
  }
}

function resolvePath(pathOrCheck: string): string | null {
  const allowedRoots = [REPO_ROOT, resolve(REPO_ROOT, '../2nd-brain/.agentic_nexus')]
  const candidate = resolve(REPO_ROOT, pathOrCheck)

  const allowed = allowedRoots.some((root) => candidate === root || candidate.startsWith(`${root}${sep}`))
  return allowed ? candidate : null
}

function normalizeProject(raw: RawProjectDefinitionOfDone): ProjectDefinitionOfDone {
  return {
    projectId: raw.project_id,
    projectName: raw.project_name,
    ownerRole: raw.owner_role,
    approverRole: raw.approver_role,
    completionThreshold: raw.completion_threshold,
    falseDonePreventionActive: raw.false_done_prevention_active,
    requirements: raw.requirements.map((requirement) => ({
      requirementId: requirement.requirement_id,
      projectId: requirement.project_id,
      category: requirement.category,
      description: requirement.description,
      probeType: requirement.probe_type,
      probeCommandOrCheck: requirement.probe_command_or_check,
      passCondition: requirement.pass_condition,
      evidenceRequired: [...requirement.evidence_required],
      priority: requirement.priority,
      ownerRole: requirement.owner_role,
      hardGate: requirement.hard_gate,
      status: requirement.status,
    })),
  }
}
