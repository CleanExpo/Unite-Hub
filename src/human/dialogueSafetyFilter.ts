/**
 * Phase 12 – Dialogue Safety Filter
 *
 * Hard validation against Phase 8 governance rules and Phase 10 autonomy policies.
 * - Domain blocking (medical, legal, financial without approval)
 * - Identity protection (no impersonation, no unauthorized external communication)
 * - Autonomy policy enforcement (action categories with approval gates)
 * - Content filtering (no harmful advice)
 * - Response validation (flagged vs. blocked)
 *
 * Integration: Receives DialogueInteraction from realtimeDialogueOrchestrator
 * Feeds: realtimeDialogueOrchestrator (safety_status and flags)
 * Output: SafetyCheckResult with pass/fail + reasoning
 */

import type { DialogueTurn } from './dialogueStateEngine';
import type { PersonalizedResponse } from './voicePersonaEngine';
import type { AdvisorResponse } from './realTimeAdvisorBridge';

// DialogueInteraction imported via realtimeDialogueOrchestrator to avoid circular deps
export type DialogueInteraction = any; // Will be properly typed from realtimeDialogueOrchestrator

// ============================================================================
// SAFETY FILTER TYPES
// ============================================================================

export type SafetyStatus = 'safe' | 'flagged' | 'blocked';

export type BlockReason =
  | 'medical_advice'
  | 'legal_advice'
  | 'financial_execution'
  | 'identity_misuse'
  | 'external_communication_blocked'
  | 'autonomy_violation'
  | 'harmful_content'
  | 'policy_violation'
  | 'manual_override';

export interface SafetyCheckResult {
  // Status
  status: SafetyStatus; // 'safe' | 'flagged' | 'blocked'
  approved: boolean;

  // Reasoning
  reasons: BlockReason[];
  explanation: string;

  // Approval Gate
  requires_founder_approval: boolean;
  approval_priority: 'low' | 'medium' | 'high' | 'critical';

  // Recommendations
  suggested_response?: string; // Alternative safe response
  audit_log_entry?: string;
}

export interface DialogueSafetyConfig {
  // Governance Integration
  phase8_enabled: boolean;
  phase10_enabled: boolean;

  // Domain Restrictions
  allow_medical_advice: boolean;
  allow_legal_advice: boolean;
  allow_financial_execution: boolean;

  // Communication Restrictions
  allow_external_communication: boolean;
  allow_identity_representation: boolean;

  // Audit
  log_all_checks: boolean;
  log_blocked_only: boolean;
}

export const DEFAULT_SAFETY_CONFIG: DialogueSafetyConfig = {
  phase8_enabled: true,
  phase10_enabled: true,
  allow_medical_advice: false, // HARD BLOCK
  allow_legal_advice: false, // HARD BLOCK
  allow_financial_execution: false, // Requires approval
  allow_external_communication: false, // Blocked without approval
  allow_identity_representation: false, // HARD BLOCK
  log_all_checks: true,
  log_blocked_only: false,
};

// ============================================================================
// SAFETY VALIDATION
// ============================================================================

/**
 * Run comprehensive safety check on dialogue interaction
 */
export function validateDialogueSafety(input: {
  interaction: DialogueInteraction;
  config: DialogueSafetyConfig;
  user_id: string;
  workspace_id: string;
}): SafetyCheckResult {
  const reasons: BlockReason[] = [];
  let status: SafetyStatus = 'safe';
  let requiresApproval = false;

  // Step 1: Check domain restrictions
  const domainCheck = checkDomainRestrictions(input.interaction, input.config);
  if (domainCheck.status !== 'safe') {
    reasons.push(...domainCheck.reasons);
    status = domainCheck.status;
    requiresApproval = requiresApproval || domainCheck.requires_approval;
  }

  // Step 2: Check identity protection
  if (input.config.phase8_enabled) {
    const identityCheck = checkIdentityProtection(input.interaction, input.config);
    if (identityCheck.status !== 'safe') {
      reasons.push(...identityCheck.reasons);
      status = 'blocked'; // Identity violations are always blocked
      requiresApproval = false; // Can't be approved
    }
  }

  // Step 3: Check communication authorization
  const commCheck = checkCommunicationAuthorization(input.interaction, input.config);
  if (commCheck.status !== 'safe') {
    reasons.push(...commCheck.reasons);
    if (status !== 'blocked') status = commCheck.status;
    requiresApproval = requiresApproval || commCheck.requires_approval;
  }

  // Step 4: Check autonomy policy (Phase 10)
  if (input.config.phase10_enabled && input.interaction.advisor_response) {
    const autonomyCheck = checkAutonomyPolicy(input.interaction, input.config);
    if (autonomyCheck.status !== 'safe') {
      reasons.push(...autonomyCheck.reasons);
      if (status !== 'blocked') status = autonomyCheck.status;
      requiresApproval = requiresApproval || autonomyCheck.requires_approval;
    }
  }

  // Step 5: Check response content
  const contentCheck = checkResponseContent(input.interaction.personalized_response);
  if (contentCheck.status !== 'safe') {
    reasons.push(...contentCheck.reasons);
    if (status !== 'blocked') status = contentCheck.status;
  }

  // Generate explanation
  const explanation = generateSafetyExplanation(reasons);

  // Determine approval priority
  let approval_priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (reasons.some((r) => r === 'financial_execution')) approval_priority = 'high';
  if (reasons.some((r) => r === 'external_communication_blocked')) approval_priority = 'medium';
  if (reasons.some((r) => r === 'autonomy_violation')) approval_priority = 'critical';

  // Suggest alternative response if blocked
  let suggested_response: string | undefined;
  if (status === 'flagged' || status === 'blocked') {
    suggested_response = generateSafeAlternative(reasons);
  }

  // Deduplicate reasons
  const uniqueReasons: BlockReason[] = [];
  const seenReasons = new Map<BlockReason, boolean>();
  for (const reason of reasons) {
    if (!seenReasons.has(reason)) {
      uniqueReasons.push(reason);
      seenReasons.set(reason, true);
    }
  }

  return {
    status,
    approved: status === 'safe',
    reasons: uniqueReasons,
    explanation,
    requires_founder_approval: requiresApproval,
    approval_priority,
    suggested_response,
    audit_log_entry: generateAuditEntry(input, status, reasons),
  };
}

// ============================================================================
// DOMAIN RESTRICTION CHECKS
// ============================================================================

function checkDomainRestrictions(
  interaction: DialogueInteraction,
  config: DialogueSafetyConfig
): {
  status: SafetyStatus;
  reasons: BlockReason[];
  requires_approval: boolean;
} {
  const reasons: BlockReason[] = [];
  const domain = interaction.user_turn.domain.toLowerCase();

  // Check domain type
  if (domain.includes('medical') || domain.includes('health')) {
    if (!config.allow_medical_advice) {
      reasons.push('medical_advice');
      return { status: 'blocked', reasons, requires_approval: false };
    }
  }

  if (domain.includes('legal') || domain.includes('law')) {
    if (!config.allow_legal_advice) {
      reasons.push('legal_advice');
      return { status: 'blocked', reasons, requires_approval: false };
    }
  }

  if (
    domain.includes('financial') ||
    domain.includes('trading') ||
    domain.includes('investment') ||
    domain.includes('execute_trade')
  ) {
    if (!config.allow_financial_execution) {
      reasons.push('financial_execution');
      return { status: 'flagged', reasons, requires_approval: true };
    }
  }

  return { status: 'safe', reasons, requires_approval: false };
}

// ============================================================================
// IDENTITY PROTECTION
// ============================================================================

function checkIdentityProtection(
  interaction: DialogueInteraction,
  config: DialogueSafetyConfig
): {
  status: SafetyStatus;
  reasons: BlockReason[];
} {
  const reasons: BlockReason[] = [];

  // Check if response attempts to speak as Phill to external parties
  const responseText = interaction.personalized_response.text.toLowerCase();
  const userText = interaction.user_turn.transcript.toLowerCase();

  // HARD BLOCKS for identity misuse
  if (responseText.includes('call') && responseText.includes('email') && responseText.includes('person')) {
    // Attempting to impersonate in communication
    reasons.push('identity_misuse');
  }

  // Check for unauthorized external communication markers
  if (
    (responseText.includes('i will email') || responseText.includes('i will call') || responseText.includes('i will text')) &&
    userText.includes('contact') &&
    !config.allow_external_communication
  ) {
    reasons.push('external_communication_blocked');
  }

  const status = reasons.length > 0 ? 'blocked' : 'safe';
  return { status, reasons };
}

// ============================================================================
// COMMUNICATION AUTHORIZATION
// ============================================================================

function checkCommunicationAuthorization(
  interaction: DialogueInteraction,
  config: DialogueSafetyConfig
): {
  status: SafetyStatus;
  reasons: BlockReason[];
  requires_approval: boolean;
} {
  const reasons: BlockReason[] = [];
  const responseText = interaction.personalized_response.text.toLowerCase();

  // Check if response involves communication (email, call, message)
  const communicationMarkers = ['send', 'email', 'call', 'text', 'message', 'reach out', 'contact'];
  const involvesComm = communicationMarkers.some((marker) => responseText.includes(marker));

  if (involvesComm && !config.allow_external_communication) {
    reasons.push('external_communication_blocked');
    return { status: 'flagged', reasons, requires_approval: true };
  }

  return { status: 'safe', reasons, requires_approval: false };
}

// ============================================================================
// AUTONOMY POLICY CHECKS (Phase 10 Integration)
// ============================================================================

function checkAutonomyPolicy(
  interaction: DialogueInteraction,
  config: DialogueSafetyConfig
): {
  status: SafetyStatus;
  reasons: BlockReason[];
  requires_approval: boolean;
} {
  const reasons: BlockReason[] = [];

  if (!interaction.advisor_response) {
    return { status: 'safe', reasons, requires_approval: false };
  }

  const advisor = interaction.advisor_response;

  // If advisor recommends action that requires approval, flag it
  if (advisor.requires_founder_approval) {
    reasons.push('autonomy_violation');
    return {
      status: 'flagged',
      reasons,
      requires_approval: true,
    };
  }

  // Check risk level
  if (advisor.risk_level === 'critical') {
    reasons.push('autonomy_violation');
    return { status: 'flagged', reasons, requires_approval: true };
  }

  // Check if autonomy policy is violated
  if (!advisor.can_execute_autonomously) {
    reasons.push('autonomy_violation');
    return { status: 'flagged', reasons, requires_approval: true };
  }

  return { status: 'safe', reasons, requires_approval: false };
}

// ============================================================================
// RESPONSE CONTENT FILTERING
// ============================================================================

function checkResponseContent(response: PersonalizedResponse): {
  status: SafetyStatus;
  reasons: BlockReason[];
} {
  const reasons: BlockReason[] = [];
  const text = response.text.toLowerCase();

  // Check for harmful content patterns
  const harmfulPatterns = [
    { pattern: /medical|health|symptom|diagnose|prescribe/, context: 'medical' },
    { pattern: /sue|lawsuit|legal action|court/, context: 'legal' },
    { pattern: /guarantee|promise|assured|guaranteed/, context: 'harmful_claim' },
  ];

  for (const { pattern, context } of harmfulPatterns) {
    if (pattern.test(text)) {
      reasons.push('harmful_content');
      break;
    }
  }

  const status = reasons.length > 0 ? 'flagged' : 'safe';
  return { status, reasons };
}

// ============================================================================
// RESPONSE GENERATION
// ============================================================================

function generateSafetyExplanation(reasons: BlockReason[]): string {
  const explanations: Record<BlockReason, string> = {
    medical_advice: 'Cannot provide medical advice. Recommend consulting a healthcare professional.',
    legal_advice: 'Cannot provide legal advice. Recommend consulting a licensed attorney.',
    financial_execution: 'Financial decisions require founder approval before execution.',
    identity_misuse: 'Cannot impersonate or represent identity to external parties.',
    external_communication_blocked: 'External communications require explicit founder approval.',
    autonomy_violation: 'Action violates Phase 10 autonomy policy. Requires approval.',
    harmful_content: 'Response contains potentially harmful claims or advice.',
    policy_violation: 'Response violates platform safety policy.',
    manual_override: 'Safety decision manually overridden.',
  };

  if (reasons.length === 0) return 'Safety check passed.';

  // Deduplicate reasons
  const uniqueReasons: BlockReason[] = [];
  const seenReasons = new Map<BlockReason, boolean>();
  for (const reason of reasons) {
    if (!seenReasons.has(reason)) {
      uniqueReasons.push(reason);
      seenReasons.set(reason, true);
    }
  }

  return uniqueReasons.map((r) => explanations[r] || 'Safety concern detected.').join(' ');
}

function generateSafeAlternative(reasons: BlockReason[]): string {
  const alternatives: Record<BlockReason, string> = {
    medical_advice: 'I can help you find healthcare resources. Would you like me to recommend some reputable medical references?',
    legal_advice:
      'I can help you understand your situation, but for legal guidance, please consult a licensed attorney. Would you like contact information for legal professionals?',
    financial_execution:
      'This action requires your explicit approval. I can outline the details and wait for your confirmation before proceeding.',
    identity_misuse: "I can help draft communication, but you'll need to send it yourself to maintain authenticity.",
    external_communication_blocked: 'I can draft the communication, but this action requires your approval to proceed.',
    autonomy_violation: 'This requires your approval. Let me present the full details so you can make the decision.',
    harmful_content: 'Let me rephrase that in a safer way. Would you like me to provide verified, evidence-based information instead?',
    policy_violation: 'I cannot take that action due to platform policies. Is there another way I can help?',
    manual_override: 'This decision has been manually overridden.',
  };

  // Deduplicate reasons
  const uniqueReasons: BlockReason[] = [];
  const seenReasons = new Map<BlockReason, boolean>();
  for (const reason of reasons) {
    if (!seenReasons.has(reason)) {
      uniqueReasons.push(reason);
      seenReasons.set(reason, true);
    }
  }

  if (uniqueReasons.length === 0) return 'Response approved.';

  return alternatives[uniqueReasons[0]] || 'Please confirm this action with the founder.';
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

function generateAuditEntry(
  input: {
    interaction: DialogueInteraction;
    config: DialogueSafetyConfig;
    user_id: string;
    workspace_id: string;
  },
  status: SafetyStatus,
  reasons: BlockReason[]
): string {
  const timestamp = new Date().toISOString();
  const interaction = input.interaction;

  return JSON.stringify(
    {
      timestamp,
      interaction_id: interaction.interaction_id,
      session_id: interaction.session_id,
      user_id: input.user_id,
      workspace_id: input.workspace_id,
      user_input: interaction.user_turn.transcript.substring(0, 100),
      assistant_output: interaction.personalized_response.text.substring(0, 100),
      domain: interaction.user_turn.domain,
      status,
      reasons,
      safety_status: interaction.safety_status,
      latency_ms: interaction.total_latency_ms,
    },
    null,
    2
  );
}

// ============================================================================
// BATCH SAFETY CHECK
// ============================================================================

/**
 * Check multiple interactions for batch processing (e.g., campaign review)
 */
export function validateBatchSafety(input: {
  interactions: DialogueInteraction[];
  config: DialogueSafetyConfig;
  user_id: string;
  workspace_id: string;
}): {
  safe_interactions: DialogueInteraction[];
  flagged_interactions: { interaction: DialogueInteraction; result: SafetyCheckResult }[];
  blocked_interactions: { interaction: DialogueInteraction; result: SafetyCheckResult }[];
  summary: {
    total: number;
    safe: number;
    flagged: number;
    blocked: number;
    approval_required: number;
  };
} {
  const safe: DialogueInteraction[] = [];
  const flagged: { interaction: DialogueInteraction; result: SafetyCheckResult }[] = [];
  const blocked: { interaction: DialogueInteraction; result: SafetyCheckResult }[] = [];

  for (const interaction of input.interactions) {
    const result = validateDialogueSafety({
      interaction,
      config: input.config,
      user_id: input.user_id,
      workspace_id: input.workspace_id,
    });

    if (result.status === 'safe') {
      safe.push(interaction);
    } else if (result.status === 'flagged') {
      flagged.push({ interaction, result });
    } else {
      blocked.push({ interaction, result });
    }
  }

  return {
    safe_interactions: safe,
    flagged_interactions: flagged,
    blocked_interactions: blocked,
    summary: {
      total: input.interactions.length,
      safe: safe.length,
      flagged: flagged.length,
      blocked: blocked.length,
      approval_required: flagged.length, // All flagged need approval
    },
  };
}

// ============================================================================
// SAFETY POLICY MANAGEMENT
// ============================================================================

export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;

  // Domain Rules
  domain_rules: {
    domain: string;
    allowed: boolean;
    requires_approval: boolean;
    approval_level: 'low' | 'medium' | 'high' | 'critical';
  }[];

  // Communication Rules
  communication_rules: {
    rule_type: 'email' | 'call' | 'message' | 'external_api';
    allowed: boolean;
    requires_approval: boolean;
  }[];

  // Created
  created_at: string;
  updated_at: string;
}

/**
 * Load custom safety policy (from database in production)
 */
export function createCustomSafetyPolicy(input: {
  workspace_id: string;
  policy_name: string;
  allowed_domains: string[];
  require_approval_domains: string[];
  allow_external_comm: boolean;
}): SafetyPolicy {
  const domainRules = [
    // Default rules
    { domain: 'medical', allowed: false, requires_approval: false, approval_level: 'critical' },
    { domain: 'legal', allowed: false, requires_approval: false, approval_level: 'critical' },
    { domain: 'financial', allowed: true, requires_approval: true, approval_level: 'high' },
  ];

  // Add custom rules
  for (const domain of input.allowed_domains) {
    domainRules.push({
      domain,
      allowed: true,
      requires_approval: false,
      approval_level: 'low' as const,
    });
  }

  for (const domain of input.require_approval_domains) {
    domainRules.push({
      domain,
      allowed: true,
      requires_approval: true,
      approval_level: 'medium' as const,
    });
  }

  return {
    id: `sp_${Date.now()}`,
    name: input.policy_name,
    description: `Custom safety policy for workspace ${input.workspace_id}`,
    domain_rules: domainRules,
    communication_rules: [
      {
        rule_type: 'email',
        allowed: input.allow_external_comm,
        requires_approval: !input.allow_external_comm,
      },
      {
        rule_type: 'call',
        allowed: input.allow_external_comm,
        requires_approval: !input.allow_external_comm,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
