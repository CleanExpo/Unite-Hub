export type SkillEvolutionPromotionStatus =
  | 'candidate_ready'
  | 'blocked_human_gate'
  | 'blocked_below_threshold'
  | 'monitoring_only'

export interface SkillEvolutionRecord {
  skillId: string
  currentVersion: string
  candidateVersion: string
  modelLane: string
  evalStrategy: 'deterministic_graders' | 'llm_as_judge_stub' | 'human_review' | 'hybrid_local'
  graders: string[]
  passThreshold: number
  latestScore: number
  promotionStatus: SkillEvolutionPromotionStatus
  rollbackAvailable: boolean
  evidencePath: string
  productionGateRequired: true
  status: 'under_evaluation' | 'candidate_ready' | 'blocked' | 'monitoring'
  externalEvalApiCalled: false
  apiKeyMode: false
  liveAutoPromotionEnabled: false
  humanGateRequired: boolean
}

export interface SkillEvaluationGrader {
  graderId: string
  name: string
  input: string[]
  output: string[]
  scoringRange: { min: 0; max: 1 }
  passThreshold: number
  failureReasons: string[]
  safeAutomatedUse: string
  humanReviewRequiredWhen: string[]
}

export interface SkillPromptVersion {
  skillId: string
  currentVersion: string
  candidateVersion: string
  rollbackVersion: string
  candidateLive: false
  productionMutationAllowed: false
  rollbackAvailable: boolean
  promotionGateRequired: boolean
  evidencePath: string
}

export interface PromotionGateInput {
  latestScore: number
  passThreshold: number
  humanGateRequired: boolean
  productionGateRequired: boolean
  liveAutoPromotionEnabled: boolean
}

export interface PromotionGateDecision {
  allowed: boolean
  status: 'promotion_candidate_ready' | 'refused_below_threshold' | 'refused_human_gate_required' | 'refused_production_gate_required' | 'refused_auto_promotion_disabled'
  reasons: string[]
  productionMutationAllowed: false
}

export interface SkillEvolutionStatus {
  source: 'static_local_evolution_registry'
  status: 'local_foundation_ready'
  skillsUnderEvaluation: number
  gradersDefined: number
  promptVersionsTracked: number
  promotionCandidates: number
  blockedPromotions: number
  nextRecommendedSkillToEvaluate: 'senior_project_manager_autopilot'
  noApiKeyMode: true
  externalEvalApiCalled: false
  paidApiEvalCalled: false
  productionDbTouched: false
  productionAutoPromotionAllowed: false
  liveAutoPromotionEnabled: false
  liveSkillMutationAllowed: false
  rollbackAvailableCount: number
  boardApprovalRequiredCount: number
  latestEvalRun: {
    evalRunId: string
    skillId: string
    score: number
    passThreshold: number
    status: 'local_candidate_ready'
    evidencePath: string
  }
}

const EVOLUTION_RECORDS: SkillEvolutionRecord[] = [
  {
    skillId: 'senior_project_manager_autopilot',
    currentVersion: 'spm-autopilot-v1',
    candidateVersion: 'spm-autopilot-v1.1-local-eval',
    modelLane: 'hermes_local',
    evalStrategy: 'hybrid_local',
    graders: ['senior_pm_next_action_quality', 'evidence_audit_completeness', 'dashboard_update_quality', 'security_gate_compliance'],
    passThreshold: 0.85,
    latestScore: 0.91,
    promotionStatus: 'candidate_ready',
    rollbackAvailable: true,
    evidencePath: '.agentic_nexus/SENIOR_PM_AUTOPILOT_EVAL_CANDIDATE.md',
    productionGateRequired: true,
    status: 'candidate_ready',
    externalEvalApiCalled: false,
    apiKeyMode: false,
    liveAutoPromotionEnabled: false,
    humanGateRequired: false,
  },
  {
    skillId: 'board_strategy_council', currentVersion: 'board-risk-v1', candidateVersion: 'board-risk-v1.1-local-eval', modelLane: 'hermes_local', evalStrategy: 'human_review', graders: ['board_risk_review_quality', 'security_gate_compliance'], passThreshold: 0.9, latestScore: 0.88, promotionStatus: 'blocked_human_gate', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/board_strategy_council/latest.json', productionGateRequired: true, status: 'blocked', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: true,
  },
  {
    skillId: 'research_intelligence', currentVersion: 'research-v1', candidateVersion: 'research-v1.1-citation-eval', modelLane: 'hermes_local', evalStrategy: 'deterministic_graders', graders: ['research_citation_quality'], passThreshold: 0.86, latestScore: 0.82, promotionStatus: 'blocked_below_threshold', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/research_intelligence/latest.json', productionGateRequired: true, status: 'blocked', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: false,
  },
  {
    skillId: 'course_builder', currentVersion: 'course-v1', candidateVersion: 'course-v1.1-usefulness-eval', modelLane: 'agentic_nexus_skill_exec', evalStrategy: 'deterministic_graders', graders: ['course_outline_usefulness'], passThreshold: 0.84, latestScore: 0.85, promotionStatus: 'candidate_ready', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/course_builder/latest.json', productionGateRequired: true, status: 'candidate_ready', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: false,
  },
  {
    skillId: 'content_engine', currentVersion: 'content-v1', candidateVersion: 'content-v1.1-brand-voice-eval', modelLane: 'hermes_local', evalStrategy: 'llm_as_judge_stub', graders: ['content_brand_voice_fit'], passThreshold: 0.87, latestScore: 0.8, promotionStatus: 'blocked_below_threshold', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/content_engine/latest.json', productionGateRequired: true, status: 'blocked', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: true,
  },
  {
    skillId: 'seo_aeo_geo', currentVersion: 'seo-v1', candidateVersion: 'seo-v1.1-evidence-eval', modelLane: 'hermes_local', evalStrategy: 'deterministic_graders', graders: ['seo_aeo_geo_evidence_quality'], passThreshold: 0.86, latestScore: 0.84, promotionStatus: 'blocked_below_threshold', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/seo_aeo_geo/latest.json', productionGateRequired: true, status: 'blocked', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: false,
  },
  {
    skillId: 'senior_devops', currentVersion: 'devops-v1', candidateVersion: 'devops-v1.1-validation-eval', modelLane: 'hermes_local', evalStrategy: 'deterministic_graders', graders: ['devops_validation_completeness', 'security_gate_compliance'], passThreshold: 0.88, latestScore: 0.9, promotionStatus: 'candidate_ready', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/senior_devops/latest.json', productionGateRequired: true, status: 'candidate_ready', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: false,
  },
  {
    skillId: 'security_compliance', currentVersion: 'security-v1', candidateVersion: 'security-v1.1-gate-eval', modelLane: 'hermes_local', evalStrategy: 'human_review', graders: ['security_gate_compliance'], passThreshold: 0.94, latestScore: 0.93, promotionStatus: 'blocked_human_gate', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/security_compliance/latest.json', productionGateRequired: true, status: 'blocked', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: true,
  },
  {
    skillId: 'evidence_audit_clerk', currentVersion: 'evidence-v1', candidateVersion: 'evidence-v1.1-completeness-eval', modelLane: 'agentic_nexus_skill_exec', evalStrategy: 'deterministic_graders', graders: ['evidence_audit_completeness'], passThreshold: 0.9, latestScore: 0.92, promotionStatus: 'candidate_ready', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/evidence_audit_clerk/latest.json', productionGateRequired: true, status: 'candidate_ready', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: false,
  },
  {
    skillId: 'dashboard_analyst', currentVersion: 'dashboard-v1', candidateVersion: 'dashboard-v1.1-status-eval', modelLane: 'agentic_nexus_skill_exec', evalStrategy: 'deterministic_graders', graders: ['dashboard_update_quality'], passThreshold: 0.86, latestScore: 0.89, promotionStatus: 'candidate_ready', rollbackAvailable: true, evidencePath: '.agentic_nexus/evals/dashboard_analyst/latest.json', productionGateRequired: true, status: 'candidate_ready', externalEvalApiCalled: false, apiKeyMode: false, liveAutoPromotionEnabled: false, humanGateRequired: false,
  },
]

const GRADERS: SkillEvaluationGrader[] = [
  { graderId: 'senior_pm_next_action_quality', name: 'Senior PM next-action quality', input: ['objective', 'last actions', 'blocked gates', 'proposed next 15-20 actions'], output: ['score', 'failure_reasons', 'recommended_revision'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.85, failureReasons: ['does not chain safe work', 'asks what next when safe work remains', 'misses true gate'], safeAutomatedUse: 'local deterministic/LLM-as-judge stub only; no external API calls', humanReviewRequiredWhen: ['promotion to live skill', 'authority scope changes'] },
  { graderId: 'board_risk_review_quality', name: 'Board risk review quality', input: ['decision packet', 'risk register', 'gates'], output: ['score', 'risk_gaps'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.9, failureReasons: ['unclear risk', 'missing authority gate', 'weak business value'], safeAutomatedUse: 'local read-only packet review', humanReviewRequiredWhen: ['Board decision', 'production/live action'] },
  { graderId: 'research_citation_quality', name: 'Research citation quality', input: ['claims', 'citations', 'source excerpts'], output: ['score', 'unsupported_claims'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.86, failureReasons: ['missing citation', 'stale source', 'claim/source mismatch'], safeAutomatedUse: 'local citation shape and excerpt checks', humanReviewRequiredWhen: ['public publishing', 'client advice'] },
  { graderId: 'course_outline_usefulness', name: 'Course outline usefulness', input: ['learner persona', 'outline', 'outcomes'], output: ['score', 'improvement_notes'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.84, failureReasons: ['unclear outcomes', 'weak sequence', 'missing assessment'], safeAutomatedUse: 'local course packet scoring', humanReviewRequiredWhen: ['public launch', 'paid offer'] },
  { graderId: 'content_brand_voice_fit', name: 'Content brand voice fit', input: ['brand guide', 'draft', 'audience'], output: ['score', 'voice_gaps'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.87, failureReasons: ['generic voice', 'unsupported claims', 'publication risk'], safeAutomatedUse: 'local draft review only', humanReviewRequiredWhen: ['publishing', 'client comms'] },
  { graderId: 'seo_aeo_geo_evidence_quality', name: 'SEO/AEO/GEO evidence quality', input: ['query set', 'SERP/evidence notes', 'recommendations'], output: ['score', 'evidence_gaps'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.86, failureReasons: ['no evidence', 'weak source', 'unclear search intent'], safeAutomatedUse: 'local evidence packet review', humanReviewRequiredWhen: ['public campaign launch'] },
  { graderId: 'devops_validation_completeness', name: 'DevOps validation completeness', input: ['commands', 'outputs', 'risks'], output: ['score', 'missing_validation'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.88, failureReasons: ['no command output', 'missing rollback', 'unsafe deploy assumption'], safeAutomatedUse: 'local CI/test evidence scoring', humanReviewRequiredWhen: ['deploy', 'prod migration'] },
  { graderId: 'security_gate_compliance', name: 'Security/gate compliance', input: ['planned action', 'hard gates', 'evidence'], output: ['score', 'violations'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.94, failureReasons: ['secret exposure', 'OP auth retry', 'prod DB/deploy attempted', 'browser/computer use attempted'], safeAutomatedUse: 'local hard-gate checks', humanReviewRequiredWhen: ['any gate exception'] },
  { graderId: 'evidence_audit_completeness', name: 'Evidence/audit completeness', input: ['results packet', 'audit entries', 'dashboard status'], output: ['score', 'missing_artifacts'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.9, failureReasons: ['missing audit', 'missing evidence path', 'unverified claim'], safeAutomatedUse: 'local file/artifact review', humanReviewRequiredWhen: ['external attestation'] },
  { graderId: 'dashboard_update_quality', name: 'Dashboard update quality', input: ['status json', 'summary', 'counts'], output: ['score', 'dashboard_gaps'], scoringRange: { min: 0, max: 1 }, passThreshold: 0.86, failureReasons: ['missing count', 'stale status', 'unsafe green rendering'], safeAutomatedUse: 'local dashboard feed review', humanReviewRequiredWhen: ['public reporting'] },
]

export function getSkillEvolutionRegistry(): SkillEvolutionRecord[] {
  return EVOLUTION_RECORDS.map((record) => ({ ...record, graders: [...record.graders] }))
}

export function getSkillEvolutionGraders(): SkillEvaluationGrader[] {
  return GRADERS.map((grader) => ({
    ...grader,
    input: [...grader.input],
    output: [...grader.output],
    failureReasons: [...grader.failureReasons],
    humanReviewRequiredWhen: [...grader.humanReviewRequiredWhen],
  }))
}

export function getSkillPromptVersions(): SkillPromptVersion[] {
  return EVOLUTION_RECORDS.map((record) => ({
    skillId: record.skillId,
    currentVersion: record.currentVersion,
    candidateVersion: record.candidateVersion,
    rollbackVersion: record.currentVersion,
    candidateLive: false,
    productionMutationAllowed: false,
    rollbackAvailable: record.rollbackAvailable,
    promotionGateRequired: record.productionGateRequired,
    evidencePath: record.evidencePath,
  }))
}

export function evaluateSkillPromotionGate(input: PromotionGateInput): PromotionGateDecision {
  const reasons: string[] = []
  if (input.latestScore < input.passThreshold) reasons.push('latest score is below pass threshold')
  if (input.humanGateRequired) reasons.push('human review gate is required')
  if (input.productionGateRequired) reasons.push('production promotion gate is required')
  if (!input.liveAutoPromotionEnabled) reasons.push('live auto-promotion is disabled')

  if (input.latestScore < input.passThreshold) {
    return { allowed: false, status: 'refused_below_threshold', reasons, productionMutationAllowed: false }
  }
  if (input.humanGateRequired) {
    return { allowed: false, status: 'refused_human_gate_required', reasons, productionMutationAllowed: false }
  }
  if (input.productionGateRequired) {
    return { allowed: false, status: 'refused_production_gate_required', reasons, productionMutationAllowed: false }
  }
  if (!input.liveAutoPromotionEnabled) {
    return { allowed: false, status: 'refused_auto_promotion_disabled', reasons, productionMutationAllowed: false }
  }
  return { allowed: false, status: 'promotion_candidate_ready', reasons: ['manual promotion gate required'], productionMutationAllowed: false }
}

export function getSkillEvolutionStatus(): SkillEvolutionStatus {
  const records = getSkillEvolutionRegistry()
  const graders = getSkillEvolutionGraders()
  const candidates = records.filter((record) => record.promotionStatus === 'candidate_ready')
  const blocked = records.filter((record) => record.promotionStatus === 'blocked_human_gate' || record.promotionStatus === 'blocked_below_threshold')
  return {
    source: 'static_local_evolution_registry',
    status: 'local_foundation_ready',
    skillsUnderEvaluation: records.length,
    gradersDefined: graders.length,
    promptVersionsTracked: records.length,
    promotionCandidates: candidates.length,
    blockedPromotions: blocked.length,
    nextRecommendedSkillToEvaluate: 'senior_project_manager_autopilot',
    noApiKeyMode: true,
    externalEvalApiCalled: false,
    paidApiEvalCalled: false,
    productionDbTouched: false,
    productionAutoPromotionAllowed: false,
    liveAutoPromotionEnabled: false,
    liveSkillMutationAllowed: false,
    rollbackAvailableCount: records.filter((record) => record.rollbackAvailable).length,
    boardApprovalRequiredCount: records.filter((record) => record.productionGateRequired || record.humanGateRequired).length,
    latestEvalRun: {
      evalRunId: 'local-eval-senior-project-manager-autopilot-001',
      skillId: 'senior_project_manager_autopilot',
      score: 0.91,
      passThreshold: 0.85,
      status: 'local_candidate_ready',
      evidencePath: '.agentic_nexus/SENIOR_PM_AUTOPILOT_EVAL_CANDIDATE.md',
    },
  }
}
