export type MargotActionClass =
  | 'auto_execute'
  | 'draft'
  | 'delegate'
  | 'ask_board'
  | 'block'
  | 'never_do'

export type OperatingBrainSignalSource =
  | 'linear'
  | 'github'
  | 'vercel'
  | 'supabase'
  | 'voice'
  | 'crm_event'
  | 'portfolio_doc'
  | 'hermes_tick'
  | 'pi_dev_ops'
  | 'second_brain'

export interface MargotDecisionInput {
  source: OperatingBrainSignalSource
  intent: string
  summary: string
  affectedEntities?: string[]
  evidenceLinks?: string[]
  isReadOnly?: boolean
  isDocsOnly?: boolean
  requiresCodeChange?: boolean
  hasVerificationPath?: boolean
  productionWrite?: boolean
  environmentMutation?: boolean
  deploymentAction?: boolean
  databaseMigration?: boolean
  externalCommunication?: boolean
  billingOrPayment?: boolean
  destructiveAction?: boolean
  secretExposure?: boolean
  identityUnresolved?: boolean
  clientDataMerge?: boolean
  businessJudgementRequired?: boolean
}

export interface MargotDecisionClassification {
  actionClass: MargotActionClass
  requiresBoardApproval: boolean
  reasons: string[]
  allowedOutputs: string[]
}

export interface MargotDecisionBrief {
  intent: string
  source: OperatingBrainSignalSource
  actionClass: MargotActionClass
  affectedEntities: string[]
  riskAndApprovals: string[]
  plannedChanges: string[]
  evidenceLinks: string[]
  auditId: string
}

const UNSAFE_APPROVAL_FLAGS: Array<keyof MargotDecisionInput> = [
  'productionWrite',
  'environmentMutation',
  'deploymentAction',
  'databaseMigration',
  'externalCommunication',
  'billingOrPayment',
  'clientDataMerge',
  'businessJudgementRequired',
]

export function classifyMargotAction(input: MargotDecisionInput): MargotDecisionClassification {
  const reasons: string[] = []

  if (input.secretExposure) {
    return {
      actionClass: 'never_do',
      requiresBoardApproval: false,
      reasons: ['The request would expose or store secret values.'],
      allowedOutputs: ['Refuse the unsafe action', 'Record a blocker without secret material'],
    }
  }

  if (input.destructiveAction) {
    return {
      actionClass: 'never_do',
      requiresBoardApproval: false,
      reasons: ['The request is destructive or irreversible without a safe recovery path.'],
      allowedOutputs: ['Refuse the destructive action', 'Prepare a safer rollback-aware brief'],
    }
  }

  if (input.identityUnresolved) {
    return {
      actionClass: 'block',
      requiresBoardApproval: false,
      reasons: ['Identity is unresolved, so Margot must not guess the target record or client context.'],
      allowedOutputs: ['Blocked approval item', 'Identity resolution task', 'Daily digest blocker'],
    }
  }

  const approvalReasons = UNSAFE_APPROVAL_FLAGS
    .filter((flag) => input[flag])
    .map((flag) => approvalReason(flag))

  if (approvalReasons.length > 0) {
    return {
      actionClass: 'ask_board',
      requiresBoardApproval: true,
      reasons: approvalReasons,
      allowedOutputs: ['Decision brief', 'Blocked approval item', 'Draft task', 'Command-center item'],
    }
  }

  if (input.requiresCodeChange) {
    reasons.push('The request changes implementation and should be delegated with file scope plus verification.')
    if (!input.hasVerificationPath) {
      reasons.push('No verification path was supplied, so Margot should draft the work before execution.')
      return {
        actionClass: 'draft',
        requiresBoardApproval: false,
        reasons,
        allowedOutputs: ['Implementation brief', 'Acceptance criteria', 'Test plan'],
      }
    }

    return {
      actionClass: 'delegate',
      requiresBoardApproval: false,
      reasons,
      allowedOutputs: ['Scoped agent task', 'Linear task', 'GitHub issue or PR checklist', 'Evidence update'],
    }
  }

  if (input.isReadOnly || input.isDocsOnly) {
    return {
      actionClass: 'auto_execute',
      requiresBoardApproval: false,
      reasons: ['The request is local, reversible, and has no external side effects.'],
      allowedOutputs: ['Repo doc update', 'Progress log', 'Command-center item', '2nd Brain update'],
    }
  }

  return {
    actionClass: 'draft',
    requiresBoardApproval: false,
    reasons: ['The request is safe to prepare but does not yet have enough execution detail.'],
    allowedOutputs: ['Draft plan', 'Decision brief', 'Acceptance criteria', 'Digest item'],
  }
}

export function buildMargotDecisionBrief(
  input: MargotDecisionInput,
  classification = classifyMargotAction(input),
): MargotDecisionBrief {
  return {
    intent: input.intent,
    source: input.source,
    actionClass: classification.actionClass,
    affectedEntities: input.affectedEntities ?? [],
    riskAndApprovals: [
      ...classification.reasons,
      classification.requiresBoardApproval
        ? 'Board or Phill approval is required before side effects.'
        : 'No Board approval is required for the documented safe output.',
    ],
    plannedChanges: plannedChangesFor(classification.actionClass),
    evidenceLinks: input.evidenceLinks ?? [],
    auditId: buildAuditId(input.source),
  }
}

function approvalReason(flag: keyof MargotDecisionInput): string {
  switch (flag) {
    case 'productionWrite':
      return 'Production writes require Board or Phill approval.'
    case 'environmentMutation':
      return 'Environment variable changes require approval and secret handling.'
    case 'deploymentAction':
      return 'Deployments require approval because they can change the live operating surface.'
    case 'databaseMigration':
      return 'Database migrations require review, rollback planning, and approval.'
    case 'externalCommunication':
      return 'External communications require human approval before sending.'
    case 'billingOrPayment':
      return 'Billing and payment actions require explicit approval.'
    case 'clientDataMerge':
      return 'Client data merges require verified identity and approval.'
    case 'businessJudgementRequired':
      return 'Business judgement is required beyond safe local execution.'
    default:
      return 'Approval is required.'
  }
}

function plannedChangesFor(actionClass: MargotActionClass): string[] {
  switch (actionClass) {
    case 'auto_execute':
      return ['Execute the safe local action', 'Verify the result', 'Record evidence in the 2nd Brain']
    case 'delegate':
      return ['Create a scoped task', 'Assign owner and acceptance criteria', 'Require verification evidence']
    case 'ask_board':
      return ['Prepare decision brief', 'Block side effects until approval', 'Record approved next action']
    case 'block':
      return ['Record blocker', 'Define missing prerequisite', 'Surface blocker in digest']
    case 'never_do':
      return ['Refuse unsafe action', 'Offer a safer alternative brief']
    case 'draft':
    default:
      return ['Draft the output', 'List assumptions', 'Request approval only if execution becomes unsafe']
  }
}

function buildAuditId(source: OperatingBrainSignalSource): string {
  return `margot-${source}-${new Date().toISOString()}`
}
