/**
 * Phase 10 – Autonomy Policy Engine
 *
 * Implements granular autonomy levels for Parallel Phill.
 * KEY PRINCIPLE: Anything public-facing (uses Phill's identity/name) requires explicit founder approval.
 * Internal suggestions and optimizations can be fully autonomous within guardrails.
 *
 * Autonomy Matrix:
 * - Internal analysis & suggestions: FULLY AUTONOMOUS
 * - Pre-drafts in Phill's style: FULLY AUTONOMOUS but flagged for review
 * - Public actions (email, Slack, posting): APPROVAL REQUIRED
 * - Financial/legal/health decisions: ADVISOR ONLY (no action)
 * - High-risk decisions: ESCALATION REQUIRED
 */

// ============================================================================
// ACTION CLASSIFICATION & AUTONOMY LEVELS
// ============================================================================

export type ActionCategory =
  | 'internal_analysis'
  | 'pre_draft'
  | 'internal_automation'
  | 'public_communication'
  | 'financial_action'
  | 'health_action'
  | 'staff_action'
  | 'legal_action'
  | 'high_risk';

export type AutonomyLevel =
  | 'fully_autonomous'
  | 'autonomous_with_logging'
  | 'autonomous_with_review_flag'
  | 'approval_required'
  | 'escalation_required'
  | 'blocked';

export interface AutonomyDecision {
  action_id: string;
  action_type: ActionCategory;
  autonomy_level: AutonomyLevel;
  requires_approval: boolean;
  approval_required_reason?: string;
  escalation_path?: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  governance_check_passed: boolean;
  explanation: string;
}

// ============================================================================
// AUTONOMY POLICY TABLE
// ============================================================================

export const AUTONOMY_POLICIES: Record<ActionCategory, {
  default_autonomy: AutonomyLevel;
  risk_threshold: number;
  phase8_governance_required: boolean;
  public_identity_action: boolean;
  examples: string[];
  sub_rules: Record<string, AutonomyLevel>;
}> = {
  internal_analysis: {
    default_autonomy: 'fully_autonomous',
    risk_threshold: 0,
    phase8_governance_required: false,
    public_identity_action: false,
    examples: [
      'Analyze email sentiment',
      'Score leads',
      'Forecast revenue',
      'Identify bottlenecks',
    ],
    sub_rules: {
      'involves_personal_data': 'autonomous_with_logging',
      'involves_sensitive_business_data': 'autonomous_with_logging',
      'analysis_of_team_performance': 'autonomous_with_review_flag',
    },
  },

  pre_draft: {
    default_autonomy: 'autonomous_with_review_flag',
    risk_threshold: 1,
    phase8_governance_required: false,
    public_identity_action: true, // Pre-drafts might become public
    examples: [
      'Draft email to customer',
      'Draft response to team member',
      'Pre-write blog post outline',
      'Draft investor update',
    ],
    sub_rules: {
      'draft_uses_phills_name_or_signature': 'autonomous_with_review_flag',
      'draft_involves_major_commitment': 'approval_required',
      'draft_contains_no_commitments': 'autonomous_with_review_flag',
    },
  },

  internal_automation: {
    default_autonomy: 'autonomous_with_logging',
    risk_threshold: 2,
    phase8_governance_required: false,
    public_identity_action: false,
    examples: [
      'Tag contacts based on rules',
      'Update internal CRM fields',
      'Schedule internal meetings',
      'Generate internal reports',
    ],
    sub_rules: {
      'involves_external_api_calls': 'autonomous_with_logging',
      'modifies_contact_or_customer_data': 'autonomous_with_logging',
      'scheduling_external_meeting': 'approval_required',
    },
  },

  public_communication: {
    default_autonomy: 'approval_required',
    risk_threshold: 5,
    phase8_governance_required: true,
    public_identity_action: true,
    examples: [
      'Send email to customer',
      'Post to social media',
      'Slack message to team',
      'Reply to support ticket',
      'Record video message',
    ],
    sub_rules: {
      'communication_from_phills_email': 'approval_required',
      'communication_under_phills_name': 'approval_required',
      'communication_as_bot_account': 'autonomous_with_logging',
      'communication_involves_apology_or_negative_news': 'escalation_required',
      'communication_involves_offer_or_commitment': 'approval_required',
    },
  },

  financial_action: {
    default_autonomy: 'blocked',
    risk_threshold: 10,
    phase8_governance_required: true,
    public_identity_action: false,
    examples: [
      'Approve expense',
      'Execute payment',
      'Transfer funds',
      'Adjust pricing',
      'Approve budget allocation',
    ],
    sub_rules: {
      'providing_financial_advice': 'autonomous_with_review_flag', // Education only
      'analyzing_financial_data': 'fully_autonomous',
      'forecasting_financial_scenarios': 'fully_autonomous',
      'executing_financial_transaction': 'blocked',
      'approving_expense_under_threshold': 'approval_required',
    },
  },

  health_action: {
    default_autonomy: 'blocked',
    risk_threshold: 10,
    phase8_governance_required: true,
    public_identity_action: false,
    examples: [
      'Diagnose health condition',
      'Prescribe treatment',
      'Recommend medication',
      'Suggest medical procedure',
    ],
    sub_rules: {
      'health_education_or_research': 'fully_autonomous',
      'interpreting_health_metrics': 'autonomous_with_review_flag',
      'suggesting_lifestyle_change': 'autonomous_with_review_flag',
      'medical_diagnosis_or_treatment': 'blocked',
      'recommending_professional_healthcare': 'fully_autonomous',
    },
  },

  staff_action: {
    default_autonomy: 'approval_required',
    risk_threshold: 8,
    phase8_governance_required: true,
    public_identity_action: false,
    examples: [
      'Make hiring decision',
      'Fire employee',
      'Change compensation',
      'Assign project',
      'Give performance feedback',
    ],
    sub_rules: {
      'recommending_hire': 'autonomous_with_review_flag',
      'recommending_firing': 'escalation_required',
      'making_hire_decision': 'approval_required',
      'making_termination_decision': 'escalation_required',
      'assigning_project': 'autonomous_with_logging',
      'providing_feedback_from_founder': 'approval_required',
    },
  },

  legal_action: {
    default_autonomy: 'blocked',
    risk_threshold: 10,
    phase8_governance_required: true,
    public_identity_action: false,
    examples: [
      'Sign legal contract',
      'Enter binding agreement',
      'Release legal claim',
      'Disclose confidential information',
    ],
    sub_rules: {
      'legal_analysis': 'autonomous_with_review_flag',
      'legal_template_drafting': 'autonomous_with_review_flag',
      'signing_contract': 'blocked',
      'making_legal_commitment': 'blocked',
    },
  },

  high_risk: {
    default_autonomy: 'escalation_required',
    risk_threshold: 8,
    phase8_governance_required: true,
    public_identity_action: false,
    examples: [
      'Major strategic pivot',
      'Large capital expenditure',
      'Entering new market',
      'Major partnership agreement',
      'Public statement on controversial topic',
    ],
    sub_rules: {
      'analysis_of_risk': 'fully_autonomous',
      'scenario_planning': 'fully_autonomous',
      'recommendation': 'autonomous_with_review_flag',
      'execution': 'escalation_required',
    },
  },
};

// ============================================================================
// AUTONOMY DECISION MAKING
// ============================================================================

/**
 * Classify an action and determine autonomy level
 */
export function classifyAction(request: {
  action_type: ActionCategory;
  specific_action: string;
  risk_score?: number;
  involves_personal_data?: boolean;
  public_facing?: boolean;
  financial_amount?: number;
}): AutonomyDecision {
  const policy = AUTONOMY_POLICIES[request.action_type];
  const riskScore = request.risk_score ?? policy.risk_threshold;

  // Check for escalation triggers
  if (riskScore >= 8 || (request.financial_amount && request.financial_amount > 50000)) {
    return {
      action_id: `action_${Date.now()}`,
      action_type: request.action_type,
      autonomy_level: 'escalation_required',
      requires_approval: true,
      approval_required_reason: `High-risk action: risk_score=${riskScore}`,
      escalation_path: ['founder_review', 'governance_check'],
      risk_level: 'critical',
      governance_check_passed: false,
      explanation: 'This action exceeds autonomy thresholds and requires founder escalation.',
    };
  }

  // Check for approval requirements
  if (policy.public_identity_action && !request.public_facing) {
    // Pre-draft of public content requires review flag
    return {
      action_id: `action_${Date.now()}`,
      action_type: request.action_type,
      autonomy_level: 'autonomous_with_review_flag',
      requires_approval: false,
      risk_level: 'medium',
      governance_check_passed: true,
      explanation:
        'Pre-draft created. Actual sending requires explicit approval before execution.',
    };
  }

  if (request.public_facing && policy.public_identity_action) {
    return {
      action_id: `action_${Date.now()}`,
      action_type: request.action_type,
      autonomy_level: 'approval_required',
      requires_approval: true,
      approval_required_reason: 'Public-facing action using Phill identity',
      escalation_path: ['founder_approval'],
      risk_level: 'high',
      governance_check_passed: false,
      explanation: 'Actions using Phill identity must be explicitly approved.',
    };
  }

  // Default autonomy for low-risk actions
  return {
    action_id: `action_${Date.now()}`,
    action_type: request.action_type,
    autonomy_level: policy.default_autonomy,
    requires_approval: policy.default_autonomy === 'approval_required',
    risk_level: riskScore <= 2 ? 'low' : riskScore <= 5 ? 'medium' : 'high',
    governance_check_passed: riskScore <= policy.risk_threshold,
    explanation: `Action classified as ${request.action_type} with autonomy level: ${policy.default_autonomy}`,
  };
}

/**
 * Check if action passes Phase 8 governance
 * (This would call the Phase 8 governor in production)
 */
export function checkPhase8Governance(decision: AutonomyDecision): {
  passes: boolean;
  policy_violations?: string[];
  recommendation: string;
} {
  const policy = AUTONOMY_POLICIES[decision.action_type];

  if (!policy.phase8_governance_required) {
    return {
      passes: true,
      recommendation: 'No Phase 8 governance check required for this action type.',
    };
  }

  // In production: Call agiGovernor.validateDecision()
  // For MVP: Basic checks
  const violations: string[] = [];

  if (decision.risk_level === 'critical') {
    violations.push('Action risk level exceeds policy thresholds');
  }

  return {
    passes: violations.length === 0,
    policy_violations: violations.length > 0 ? violations : undefined,
    recommendation: violations.length === 0
      ? 'Action passes governance check'
      : 'Action blocked by governance policies',
  };
}

/**
 * Build escalation path for high-risk decisions
 */
export function buildEscalationPath(decision: AutonomyDecision): string[] {
  if (decision.autonomy_level !== 'escalation_required') {
    return [];
  }

  const path = ['governance_check'];

  if (decision.action_type === 'financial_action' && decision.risk_level === 'critical') {
    path.push('cfo_or_finance_review');
  }

  if (decision.action_type === 'staff_action') {
    path.push('hr_or_people_lead_review');
  }

  if (decision.action_type === 'legal_action') {
    path.push('legal_review');
  }

  path.push('founder_final_decision');

  return path;
}

/**
 * Log autonomy decision for audit trail
 */
export interface AutonomyLog {
  id: string;
  timestamp: string;
  action_id: string;
  decision: AutonomyDecision;
  founder_approval?: {
    approved_at: string;
    approved_by: string;
    notes?: string;
  };
  governance_check_result: {
    passes: boolean;
    policy_violations?: string[];
  };
  execution_status: 'pending_approval' | 'approved' | 'executed' | 'rejected';
}

export function createAutonomyLog(decision: AutonomyDecision): AutonomyLog {
  const governanceCheck = checkPhase8Governance(decision);

  return {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action_id: decision.action_id,
    decision,
    governance_check_result: {
      passes: governanceCheck.passes,
      policy_violations: governanceCheck.policy_violations,
    },
    execution_status: decision.requires_approval ? 'pending_approval' : 'approved',
  };
}

// ============================================================================
// HELPER: CHECK IF ACTION IS ALLOWED
// ============================================================================

export function canExecuteAction(decision: AutonomyDecision): {
  can_execute: boolean;
  reason: string;
  next_step: string;
} {
  // Blocked actions cannot execute at all
  if (decision.autonomy_level === 'blocked') {
    return {
      can_execute: false,
      reason: 'This action category is blocked by policy',
      next_step: 'Consult with founder for alternatives',
    };
  }

  // Escalation required actions cannot execute without founder approval
  if (decision.autonomy_level === 'escalation_required') {
    return {
      can_execute: false,
      reason: 'This action requires founder escalation and approval',
      next_step: `Follow escalation path: ${decision.escalation_path?.join(' → ')}`,
    };
  }

  // Approval required actions cannot execute without explicit approval
  if (decision.autonomy_level === 'approval_required') {
    return {
      can_execute: false,
      reason: 'This action requires explicit founder approval',
      next_step: 'Send for founder review',
    };
  }

  // Fully autonomous and logging-required can execute
  return {
    can_execute: true,
    reason: `Action can execute with autonomy level: ${decision.autonomy_level}`,
    next_step: 'Proceed with execution',
  };
}
