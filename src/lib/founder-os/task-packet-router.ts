import type {
  FounderContextPack,
  FounderRiskLevel,
  FounderTaskLane,
  FounderTaskPacket,
  FounderTaskType,
  PortfolioTarget,
  TaskPacketBuildResult,
} from './types'

export interface FounderIdeaInput {
  message: string
  now?: string
  idSeed?: string
}

interface ClassificationResult {
  portfolioTarget: PortfolioTarget
  taskType: FounderTaskType
  lane: FounderTaskLane
  riskLevel: FounderRiskLevel
  requiredAgents: string[]
  doneCriteria: string[]
  requiresLongRunningHost?: boolean
  requiresLocalExecution?: boolean
  requiresBrowser?: boolean
  requiresHumanApproval?: boolean
  routingReasons: string[]
}

export function buildTaskPacketFromIdea(input: FounderIdeaInput): TaskPacketBuildResult {
  const now = input.now ?? new Date().toISOString()
  const normalized = input.message.toLowerCase()
  const taskId = buildStableId('task', input.idSeed ?? input.message)
  const contextPackId = buildStableId('ctx', `${taskId}:${input.message}`)
  const classification = classifyFounderIdea(normalized)

  const taskPacket: FounderTaskPacket = {
    id: taskId,
    originalMessage: input.message,
    taskType: classification.taskType,
    lane: classification.lane,
    portfolioTarget: classification.portfolioTarget,
    riskLevel: classification.riskLevel,
    objective: buildObjective(input.message, classification.portfolioTarget, classification.lane),
    requiredAgents: classification.requiredAgents,
    doneCriteria: classification.doneCriteria,
    contextPackId,
    requiresLongRunningHost: classification.requiresLongRunningHost,
    requiresLocalExecution: classification.requiresLocalExecution,
    requiresBrowser: classification.requiresBrowser,
    requiresHumanApproval: classification.requiresHumanApproval,
  }

  const contextPack: FounderContextPack = {
    id: contextPackId,
    taskId,
    portfolioTarget: classification.portfolioTarget,
    originalMessage: input.message,
    durableSummary: buildDurableSummary(taskPacket),
    constraints: buildConstraints(classification),
    decisions: [
      `Portfolio target classified as ${classification.portfolioTarget}.`,
      `Execution lane classified as ${classification.lane}.`,
      `Risk level classified as ${classification.riskLevel}.`,
    ],
    evidenceLinks: [],
    blockers: classification.riskLevel === 'human_only' ? ['Human approval is required before execution.'] : [],
    nextRecommendedAction: nextRecommendedAction(classification),
    modelHistory: [],
    receiptIds: [],
    updatedAt: now,
  }

  return {
    taskPacket,
    contextPack,
    routingReasons: classification.routingReasons,
  }
}

export function classifyFounderIdea(message: string): ClassificationResult {
  const portfolioTarget = classifyPortfolioTarget(message)
  const lane = classifyLane(message)
  const taskType = classifyTaskType(message, lane)
  const riskLevel = classifyRisk(message, lane)
  const routingReasons = [
    `Detected portfolio target: ${portfolioTarget}.`,
    `Detected lane: ${lane}.`,
    `Detected task type: ${taskType}.`,
    `Detected risk level: ${riskLevel}.`,
  ]

  return {
    portfolioTarget,
    lane,
    taskType,
    riskLevel,
    requiredAgents: agentsFor(lane, riskLevel),
    doneCriteria: doneCriteriaFor(lane),
    requiresLongRunningHost: ['scheduled_brief', 'webhook_processing', 'research', 'code_change'].includes(taskType),
    requiresLocalExecution: ['heavy_build', 'code_change'].includes(taskType),
    requiresBrowser: taskType === 'browser_task',
    requiresHumanApproval: riskLevel === 'human_only' || riskLevel === 'high',
    routingReasons,
  }
}

function classifyPortfolioTarget(message: string): PortfolioTarget {
  if (includesAny(message, ['synthex', 'social media', 'linkedin', 'facebook', 'youtube', 'tiktok'])) return 'synthex'
  if (includesAny(message, ['restoreassist', 'restore assist', 'ra-', 'restoration'])) return 'restoreassist'
  if (includesAny(message, ['pi-dev-ops', 'pi dev ops', 'pi-wrapper', 'pi wrapper', 'build engine'])) return 'pi_dev_ops'
  if (includesAny(message, ['authority site', 'unite-group site', 'landing site'])) return 'authority_site'
  if (includesAny(message, ['ato', 'tax', 'australian taxation', 'bookkeeper', 'xero'])) return 'ato_app'
  if (includesAny(message, ['disaster recovery', 'nrp', 'nrpg'])) return 'disaster_recovery'
  if (includesAny(message, ['unite-hub', 'unite hub', 'crm', 'command centre', 'command center', 'founder os'])) return 'unite_hub'
  return 'unknown'
}

function classifyLane(message: string): FounderTaskLane {
  if (includesAny(message, ['approve', 'approval', 'sign off', 'sign-off'])) return 'approval_only'
  if (includesAny(message, ['bank', 'stripe', 'xero', 'ato', 'tax', 'invoice', 'payment'])) return 'finance_ops'
  if (includesAny(message, ['browser', 'chrome', 'computer use', 'playwright', 'log in', 'login'])) return 'browser_automation'
  if (includesAny(message, ['linkedin', 'facebook', 'youtube', 'tiktok', 'social'])) return 'social_ops'
  if (includesAny(message, ['account', 'password', 'username', 'credential', 'vault', 'oauth'])) return 'account_cleanup'
  if (includesAny(message, ['model', 'provider', 'gpt', 'gemini', 'grok', 'kimi', 'qwen', 'mistral', 'claude'])) return 'model_routing'
  if (includesAny(message, ['bug', 'broken', 'fix', 'error', 'failing'])) return 'bugfix'
  if (includesAny(message, ['test', 'qa', 'review', 'verify', 'polish'])) return 'qa_review'
  if (includesAny(message, ['research', 'deep research', 'investigate'])) return 'research'
  if (includesAny(message, ['build', 'implement', 'add', 'create', 'feature'])) return 'feature_build'
  return 'product_discovery'
}

function classifyTaskType(message: string, lane: FounderTaskLane): FounderTaskType {
  if (lane === 'approval_only') return 'approval'
  if (lane === 'browser_automation') return 'browser_task'
  if (lane === 'model_routing') return 'model_routing'
  if (lane === 'account_cleanup') return 'credential_grant'
  if (lane === 'finance_ops') return 'credential_grant'
  if (lane === 'qa_review') return 'ui_review'
  if (lane === 'research' || lane === 'product_discovery') return 'research'
  if (includesAny(message, ['heavy build', 'build loop', 'docker', 'local build'])) return 'heavy_build'
  if (lane === 'feature_build' || lane === 'bugfix') return 'code_change'
  return 'idea_capture'
}

function classifyRisk(message: string, lane: FounderTaskLane): FounderRiskLevel {
  if (includesAny(message, ['bank transfer', 'submit tax', 'file tax', 'move money', 'pay invoice'])) return 'human_only'
  if (includesAny(message, ['bank', 'stripe', 'xero', 'ato', 'tax', 'password', 'credential', 'vault', 'oauth', 'publish', 'send email'])) return 'high'
  if (lane === 'browser_automation' || lane === 'finance_ops' || lane === 'account_cleanup' || lane === 'social_ops') return 'high'
  if (lane === 'feature_build' || lane === 'bugfix' || lane === 'model_routing') return 'medium'
  return 'low'
}

function agentsFor(lane: FounderTaskLane, riskLevel: FounderRiskLevel): string[] {
  const agents = new Set<string>(['project-manager'])

  if (['feature_build', 'bugfix', 'qa_review', 'model_routing'].includes(lane)) {
    agents.add('senior-fullstack')
    agents.add('qa-tester')
  }

  if (['browser_automation', 'account_cleanup', 'finance_ops', 'social_ops'].includes(lane)) {
    agents.add('api-integrations')
    agents.add('security-auditor')
  }

  if (riskLevel === 'high' || riskLevel === 'human_only') {
    agents.add('risk-approval-agent')
  }

  return Array.from(agents)
}

function doneCriteriaFor(lane: FounderTaskLane): string[] {
  switch (lane) {
    case 'feature_build':
    case 'bugfix':
      return ['Scope is documented', 'Implementation is tested', 'Evidence receipt is recorded']
    case 'browser_automation':
      return ['Approval gate is defined', 'Read-only browser receipt exists', 'No security bypass is attempted']
    case 'account_cleanup':
      return ['Account owner is identified', 'Credential/vault status is classified', 'Risk level is recorded']
    case 'model_routing':
      return ['Performance/speed/cost tradeoff is recorded', 'Fallback and reviewer models are selected']
    case 'finance_ops':
      return ['Human approval requirement is explicit', 'No money/tax action is submitted automatically']
    default:
      return ['Objective is clear', 'Next action is assigned', 'Context pack is durable']
  }
}

function buildConstraints(classification: ClassificationResult): string[] {
  const constraints = ['Preserve context in Unite-Hub, not a local chat window.']
  if (classification.riskLevel === 'high' || classification.riskLevel === 'human_only') {
    constraints.push('Require Phill/Margot approval before external side effects.')
    constraints.push('Do not expose decrypted secrets to client-side UI.')
  }
  if (classification.requiresBrowser) {
    constraints.push('Browser automation must use approved sessions, screenshots/action logs, and no MFA/anti-bot bypass.')
  }
  return constraints
}

function nextRecommendedAction(classification: ClassificationResult): string {
  if (classification.requiresHumanApproval) return 'Create an approval item before assigning execution.'
  if (classification.requiresBrowser) return 'Prepare a read-only browser automation spike with receipt capture.'
  if (classification.taskType === 'code_change') return 'Assign a scoped implementation lane with tests and evidence.'
  return 'Assign the task to the run queue with a durable context pack.'
}

function buildObjective(message: string, target: PortfolioTarget, lane: FounderTaskLane): string {
  return `Process founder idea for ${target} through ${lane}: ${message}`
}

function buildDurableSummary(taskPacket: FounderTaskPacket): string {
  return `${taskPacket.portfolioTarget}/${taskPacket.lane}: ${taskPacket.objective}`
}

function includesAny(message: string, needles: string[]): boolean {
  return needles.some((needle) => message.includes(needle))
}

function buildStableId(prefix: string, value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return `${prefix}_${hash.toString(16).padStart(8, '0')}`
}
