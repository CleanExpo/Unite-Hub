/**
 * Default Business Rules for Agents
 * Predefined constraints based on Project Vend Phase 2 learnings
 *
 * These rules prevent the naive decisions that caused issues in Project Vend:
 * - Rogue pricing decisions
 * - Unhelpful score inflation
 * - Unverified content generation
 * - Budget overruns
 */

export interface RuleDefinition {
  rule_name: string;
  rule_type: 'constraint' | 'validation' | 'escalation' | 'cost_limit';
  config: Record<string, any>;
  enabled: boolean;
  priority: number;
  enforcement_level: 'block' | 'warn' | 'log';
  escalate_on_violation: boolean;
  description: string;
}

/**
 * Email Agent Default Rules
 * Prevents: Score inflation, duplicate contacts, invalid emails
 */
export const EMAIL_AGENT_RULES: RuleDefinition[] = [
  {
    rule_name: 'max_score_change_constraint',
    rule_type: 'constraint',
    config: { max_score_change: 20 },
    enabled: true,
    priority: 10, // High priority
    enforcement_level: 'block',
    escalate_on_violation: false,
    description: 'Prevents extreme score changes (>20 points) that could indicate errors'
  },
  {
    rule_name: 'min_confidence_for_important',
    rule_type: 'validation',
    config: { min_confidence: 0.8 },
    enabled: true,
    priority: 20,
    enforcement_level: 'warn',
    escalate_on_violation: true,
    description: 'Requires high confidence (>0.8) before flagging emails as important'
  },
  {
    rule_name: 'cannot_create_duplicate_contacts',
    rule_type: 'constraint',
    config: { cannot_create_duplicate_contacts: true },
    enabled: true,
    priority: 10,
    enforcement_level: 'block',
    escalate_on_violation: false,
    description: 'Prevents creating duplicate contact records'
  },
  {
    rule_name: 'must_validate_email_format',
    rule_type: 'validation',
    config: { must_validate_email_format: true },
    enabled: true,
    priority: 5, // Highest priority
    enforcement_level: 'block',
    escalate_on_violation: false,
    description: 'Ensures all email addresses are properly formatted before processing'
  },
  {
    rule_name: 'escalate_on_extreme_score_change',
    rule_type: 'escalation',
    config: { escalate_if_score_change_exceeds: 15 },
    enabled: true,
    priority: 30,
    enforcement_level: 'log',
    escalate_on_violation: true,
    description: 'Escalates when score changes exceed 15 points for human review'
  },
  {
    rule_name: 'daily_cost_limit',
    rule_type: 'cost_limit',
    config: { daily_budget_usd: 10.00 },
    enabled: true,
    priority: 5,
    enforcement_level: 'block',
    escalate_on_violation: true,
    description: 'Prevents email agent from exceeding $10/day AI spend'
  }
];

/**
 * Content Generator Default Rules
 * Prevents: Low-quality content, missing personalization, brand violations
 */
export const CONTENT_GENERATOR_RULES: RuleDefinition[] = [
  {
    rule_name: 'min_confidence_validation',
    rule_type: 'validation',
    config: { min_confidence: 0.7 },
    enabled: true,
    priority: 20,
    enforcement_level: 'block',
    escalate_on_violation: true,
    description: 'Requires minimum 0.7 confidence before generating content'
  },
  {
    rule_name: 'max_content_length',
    rule_type: 'constraint',
    config: { max_content_length: 300 },
    enabled: true,
    priority: 30,
    enforcement_level: 'warn',
    escalate_on_violation: false,
    description: 'Limits content to 300 characters for email body'
  },
  {
    rule_name: 'require_personalization_tokens',
    rule_type: 'validation',
    config: { require_personalization_tokens: true },
    enabled: true,
    priority: 10,
    enforcement_level: 'block',
    escalate_on_violation: false,
    description: 'Ensures content includes personalization tokens like {firstName}'
  },
  {
    rule_name: 'require_cta',
    rule_type: 'validation',
    config: { require_cta: true },
    enabled: true,
    priority: 20,
    enforcement_level: 'warn',
    escalate_on_violation: false,
    description: 'Ensures content includes a call-to-action'
  },
  {
    rule_name: 'cannot_use_all_caps',
    rule_type: 'validation',
    config: { cannot_use_all_caps: true },
    enabled: true,
    priority: 40,
    enforcement_level: 'warn',
    escalate_on_violation: false,
    description: 'Prevents excessive use of ALL CAPS (spam-like behavior)'
  },
  {
    rule_name: 'escalate_on_low_confidence',
    rule_type: 'escalation',
    config: { escalate_if_confidence_below: 0.75 },
    enabled: true,
    priority: 15,
    enforcement_level: 'log',
    escalate_on_violation: true,
    description: 'Escalates low-confidence content for human review'
  },
  {
    rule_name: 'daily_cost_limit',
    rule_type: 'cost_limit',
    config: { daily_budget_usd: 25.00 },
    enabled: true,
    priority: 5,
    enforcement_level: 'block',
    escalate_on_violation: true,
    description: 'Prevents content generator from exceeding $25/day AI spend'
  },
  {
    rule_name: 'per_execution_cost_limit',
    rule_type: 'cost_limit',
    config: { per_execution_limit_usd: 0.50 },
    enabled: true,
    priority: 5,
    enforcement_level: 'warn',
    escalate_on_violation: true,
    description: 'Warns if single content generation exceeds $0.50 (expensive Extended Thinking)'
  }
];

/**
 * Orchestrator Default Rules
 * Prevents: Infinite loops, stuck enrollments, condition logic errors
 */
export const ORCHESTRATOR_RULES: RuleDefinition[] = [
  {
    rule_name: 'max_enrollment_delay',
    rule_type: 'constraint',
    config: { max_enrollment_delay_hours: 24 },
    enabled: true,
    priority: 20,
    enforcement_level: 'warn',
    escalate_on_violation: false,
    description: 'Warns if enrollment delay exceeds 24 hours'
  },
  {
    rule_name: 'max_condition_depth',
    rule_type: 'constraint',
    config: { max_condition_depth: 5 },
    enabled: true,
    priority: 10,
    enforcement_level: 'block',
    escalate_on_violation: false,
    description: 'Prevents deeply nested conditions (potential infinite loops)'
  },
  {
    rule_name: 'cannot_skip_campaign_steps',
    rule_type: 'constraint',
    config: { cannot_skip_campaign_steps: true },
    enabled: true,
    priority: 5,
    enforcement_level: 'block',
    escalate_on_violation: false,
    description: 'Ensures all campaign steps execute in sequence'
  },
  {
    rule_name: 'daily_cost_limit',
    rule_type: 'cost_limit',
    config: { daily_budget_usd: 15.00 },
    enabled: true,
    priority: 5,
    enforcement_level: 'block',
    escalate_on_violation: true,
    description: 'Prevents orchestrator from exceeding $15/day AI spend'
  }
];

/**
 * Get all default rules for all agents
 */
export function getAllDefaultRules(): Record<string, RuleDefinition[]> {
  return {
    EmailAgent: EMAIL_AGENT_RULES,
    'email-processor': EMAIL_AGENT_RULES, // Alias
    'email-intelligence-agent': EMAIL_AGENT_RULES, // Alias

    ContentGenerator: CONTENT_GENERATOR_RULES,
    'content-personalization': CONTENT_GENERATOR_RULES, // Alias

    Orchestrator: ORCHESTRATOR_RULES,
    'orchestrator-router': ORCHESTRATOR_RULES // Alias
  };
}

/**
 * Get default rules for a specific agent
 */
export function getDefaultRulesForAgent(agentName: string): RuleDefinition[] {
  const allRules = getAllDefaultRules();
  return allRules[agentName] || [];
}

/**
 * Seed default rules into a workspace
 * Call this when a new workspace is created
 */
export async function seedDefaultRules(
  workspaceId: string,
  createdBy: string,
  supabaseClient: any
): Promise<void> {
  try {
    const allRules = getAllDefaultRules();
    const rulesToInsert: any[] = [];

    for (const [agentName, rules] of Object.entries(allRules)) {
      for (const rule of rules) {
        rulesToInsert.push({
          workspace_id: workspaceId,
          agent_name: agentName,
          ...rule,
          created_by: createdBy
        });
      }
    }

    const { error } = await supabaseClient
      .from('agent_business_rules')
      .insert(rulesToInsert);

    if (error) {
      console.error('Failed to seed default rules:', error);
      throw error;
    }

    console.log(`✅ Seeded ${rulesToInsert.length} default rules for workspace ${workspaceId}`);
  } catch (err) {
    console.error('Error seeding default rules:', err);
    throw err;
  }
}
