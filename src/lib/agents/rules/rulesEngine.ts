/**
 * Business Rules Engine for Agents
 * Validates actions, enforces constraints, prevents naive decisions
 *
 * Part of Project Vend Phase 2 - Agent Optimization Framework
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface BusinessRule {
  id: string;
  workspace_id: string;
  agent_name: string;
  rule_name: string;
  rule_type: 'constraint' | 'validation' | 'escalation' | 'cost_limit';
  config: Record<string, any>;
  enabled: boolean;
  priority: number;
  enforcement_level: 'block' | 'warn' | 'log';
  escalate_on_violation: boolean;
}

export interface ValidationContext {
  agent_name: string;
  workspace_id: string;
  action_type: string;
  action_data: Record<string, any>;
  execution_id?: string;
}

export interface ValidationResult {
  allowed: boolean;
  violations: RuleViolation[];
  enforcement: 'block' | 'warn' | 'log' | 'none';
  should_escalate: boolean;
}

export interface RuleViolation {
  rule_id: string;
  rule_name: string;
  rule_type: string;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  attempted_action: Record<string, any>;
  rule_config: Record<string, any>;
}

export class RulesEngine {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for RulesEngine');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Get all active rules for an agent in a workspace
   */
  async getRulesForAgent(
    agentName: string,
    workspaceId: string
  ): Promise<BusinessRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('agent_business_rules')
        .select('*')
        .eq('agent_name', agentName)
        .eq('workspace_id', workspaceId)
        .eq('enabled', true)
        .order('priority', { ascending: true });

      if (error) {
throw error;
}

      return (data || []) as BusinessRule[];
    } catch (err) {
      console.error(`Failed to get rules for ${agentName}:`, err);
      return [];
    }
  }

  /**
   * Validate an action against all applicable rules
   */
  async validateAction(context: ValidationContext): Promise<ValidationResult> {
    try {
      const rules = await this.getRulesForAgent(context.agent_name, context.workspace_id);

      if (rules.length === 0) {
        return {
          allowed: true,
          violations: [],
          enforcement: 'none',
          should_escalate: false
        };
      }

      const violations: RuleViolation[] = [];
      let mostSevereEnforcement: 'block' | 'warn' | 'log' | 'none' = 'none';
      let shouldEscalate = false;

      // Validate against each rule
      for (const rule of rules) {
        const violation = await this.checkRule(rule, context);

        if (violation) {
          violations.push(violation);

          // Track most severe enforcement level
          if (rule.enforcement_level === 'block') {
            mostSevereEnforcement = 'block';
          } else if (rule.enforcement_level === 'warn' && mostSevereEnforcement !== 'block') {
            mostSevereEnforcement = 'warn';
          } else if (rule.enforcement_level === 'log' && mostSevereEnforcement === 'none') {
            mostSevereEnforcement = 'log';
          }

          // Track escalation requirement
          if (rule.escalate_on_violation) {
            shouldEscalate = true;
          }

          // Log violation
          await this.logViolation(rule, violation, context);
        }
      }

      return {
        allowed: mostSevereEnforcement !== 'block',
        violations,
        enforcement: mostSevereEnforcement,
        should_escalate: shouldEscalate
      };
    } catch (err) {
      console.error('RulesEngine validation error:', err);
      // On error, default to allowing (fail open, but log)
      return {
        allowed: true,
        violations: [],
        enforcement: 'none',
        should_escalate: false
      };
    }
  }

  /**
   * Check a single rule against the action context
   */
  private async checkRule(
    rule: BusinessRule,
    context: ValidationContext
  ): Promise<RuleViolation | null> {
    try {
      switch (rule.rule_type) {
        case 'constraint':
          return this.checkConstraintRule(rule, context);

        case 'validation':
          return this.checkValidationRule(rule, context);

        case 'escalation':
          return this.checkEscalationRule(rule, context);

        case 'cost_limit':
          return this.checkCostLimitRule(rule, context);

        default:
          console.warn(`Unknown rule type: ${rule.rule_type}`);
          return null;
      }
    } catch (err) {
      console.error(`Error checking rule ${rule.rule_name}:`, err);
      return null;
    }
  }

  /**
   * Check constraint rules (hard limits)
   */
  private checkConstraintRule(
    rule: BusinessRule,
    context: ValidationContext
  ): RuleViolation | null {
    const config = rule.config;

    // Max score change constraint
    if (config.max_score_change !== undefined) {
      const scoreChange = context.action_data.score_change;
      if (scoreChange !== undefined && Math.abs(scoreChange) > config.max_score_change) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'constraint_exceeded',
          severity: 'high',
          message: `Score change ${scoreChange} exceeds limit of ${config.max_score_change}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Max enrollment delay constraint
    if (config.max_enrollment_delay_hours !== undefined) {
      const delayHours = context.action_data.delay_hours;
      if (delayHours !== undefined && delayHours > config.max_enrollment_delay_hours) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'constraint_exceeded',
          severity: 'medium',
          message: `Enrollment delay ${delayHours}h exceeds limit of ${config.max_enrollment_delay_hours}h`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Max condition depth constraint
    if (config.max_condition_depth !== undefined) {
      const depth = context.action_data.condition_depth;
      if (depth !== undefined && depth > config.max_condition_depth) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'constraint_exceeded',
          severity: 'medium',
          message: `Condition depth ${depth} exceeds limit of ${config.max_condition_depth}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Cannot create duplicate contacts
    if (config.cannot_create_duplicate_contacts === true) {
      if (context.action_type === 'create_contact' && context.action_data.duplicate_detected) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'constraint_exceeded',
          severity: 'medium',
          message: 'Attempted to create duplicate contact',
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Cannot skip campaign steps
    if (config.cannot_skip_campaign_steps === true) {
      if (context.action_type === 'execute_campaign_step' && context.action_data.step_skipped) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'constraint_exceeded',
          severity: 'high',
          message: 'Attempted to skip campaign step',
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    return null;
  }

  /**
   * Check validation rules (minimum requirements)
   */
  private checkValidationRule(
    rule: BusinessRule,
    context: ValidationContext
  ): RuleViolation | null {
    const config = rule.config;

    // Min confidence validation
    if (config.min_confidence !== undefined) {
      const confidence = context.action_data.confidence_score;
      if (confidence !== undefined && confidence < config.min_confidence) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'validation_failed',
          severity: 'medium',
          message: `Confidence ${confidence} below minimum ${config.min_confidence}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Require personalization tokens
    if (config.require_personalization_tokens === true) {
      const content = context.action_data.content;
      if (content && typeof content === 'string') {
        const hasTokens = /\{[a-zA-Z_]+\}/.test(content);
        if (!hasTokens) {
          return {
            rule_id: rule.id,
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            violation_type: 'validation_failed',
            severity: 'medium',
            message: 'Content missing personalization tokens',
            attempted_action: context.action_data,
            rule_config: config
          };
        }
      }
    }

    // Require CTA
    if (config.require_cta === true) {
      const content = context.action_data.content;
      if (content && typeof content === 'string') {
        const hasCTA = /<button|<a |href=|Click here|Learn more/i.test(content);
        if (!hasCTA) {
          return {
            rule_id: rule.id,
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            violation_type: 'validation_failed',
            severity: 'low',
            message: 'Content missing call-to-action',
            attempted_action: context.action_data,
            rule_config: config
          };
        }
      }
    }

    // Cannot use all caps
    if (config.cannot_use_all_caps === true) {
      const content = context.action_data.content;
      if (content && typeof content === 'string') {
        const words = content.split(' ');
        const allCapsWords = words.filter(word =>
          word.length > 2 && word === word.toUpperCase() && /[A-Z]/.test(word)
        );
        if (allCapsWords.length > 3) {
          return {
            rule_id: rule.id,
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            violation_type: 'validation_failed',
            severity: 'low',
            message: `Too many all-caps words (${allCapsWords.length})`,
            attempted_action: context.action_data,
            rule_config: config
          };
        }
      }
    }

    // Max content length
    if (config.max_content_length !== undefined) {
      const content = context.action_data.content;
      if (content && typeof content === 'string' && content.length > config.max_content_length) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'validation_failed',
          severity: 'low',
          message: `Content length ${content.length} exceeds limit ${config.max_content_length}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Must validate email format
    if (config.must_validate_email_format === true) {
      const email = context.action_data.email;
      if (email && typeof email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return {
            rule_id: rule.id,
            rule_name: rule.rule_name,
            rule_type: rule.rule_type,
            violation_type: 'validation_failed',
            severity: 'high',
            message: `Invalid email format: ${email}`,
            attempted_action: context.action_data,
            rule_config: config
          };
        }
      }
    }

    return null;
  }

  /**
   * Check escalation rules (approval triggers)
   */
  private checkEscalationRule(
    rule: BusinessRule,
    context: ValidationContext
  ): RuleViolation | null {
    const config = rule.config;

    // Escalate if score change > threshold
    if (config.escalate_if_score_change_exceeds !== undefined) {
      const scoreChange = context.action_data.score_change;
      if (scoreChange !== undefined && Math.abs(scoreChange) > config.escalate_if_score_change_exceeds) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'escalation_triggered',
          severity: 'medium',
          message: `Score change ${scoreChange} exceeds escalation threshold ${config.escalate_if_score_change_exceeds}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Escalate if confidence < threshold
    if (config.escalate_if_confidence_below !== undefined) {
      const confidence = context.action_data.confidence_score;
      if (confidence !== undefined && confidence < config.escalate_if_confidence_below) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'escalation_triggered',
          severity: 'medium',
          message: `Confidence ${confidence} below escalation threshold ${config.escalate_if_confidence_below}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    return null;
  }

  /**
   * Check cost limit rules (budget controls)
   */
  private async checkCostLimitRule(
    rule: BusinessRule,
    context: ValidationContext
  ): Promise<RuleViolation | null> {
    const config = rule.config;

    // Daily budget limit
    if (config.daily_budget_usd !== undefined) {
      const { data, error } = await this.supabase
        .from('agent_execution_metrics')
        .select('cost_usd')
        .eq('agent_name', context.agent_name)
        .eq('workspace_id', context.workspace_id)
        .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Failed to check daily budget:', error);
        return null;
      }

      const dailySpent = (data || []).reduce((sum, record) => sum + Number(record.cost_usd || 0), 0);
      const estimatedCost = context.action_data.estimated_cost_usd || 0;

      if (dailySpent + estimatedCost > config.daily_budget_usd) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'cost_limit_exceeded',
          severity: 'high',
          message: `Daily budget exceeded: $${dailySpent.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${config.daily_budget_usd}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    // Per-execution cost limit
    if (config.per_execution_limit_usd !== undefined) {
      const estimatedCost = context.action_data.estimated_cost_usd || 0;
      if (estimatedCost > config.per_execution_limit_usd) {
        return {
          rule_id: rule.id,
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          violation_type: 'cost_limit_exceeded',
          severity: 'critical',
          message: `Execution cost $${estimatedCost.toFixed(2)} exceeds limit $${config.per_execution_limit_usd}`,
          attempted_action: context.action_data,
          rule_config: config
        };
      }
    }

    return null;
  }

  /**
   * Log a rule violation to the database
   */
  private async logViolation(
    rule: BusinessRule,
    violation: RuleViolation,
    context: ValidationContext
  ): Promise<void> {
    try {
      const actionTaken = this.getActionTaken(rule.enforcement_level, rule.escalate_on_violation);

      const { error } = await this.supabase
        .from('agent_rule_violations')
        .insert({
          workspace_id: context.workspace_id,
          rule_id: rule.id,
          agent_name: context.agent_name,
          execution_id: context.execution_id,
          violation_type: violation.violation_type,
          attempted_action: violation.attempted_action,
          rule_violated: violation.rule_config,
          severity: violation.severity,
          action_taken: actionTaken,
          violated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log violation:', error);
      }
    } catch (err) {
      console.error('Error logging violation:', err);
    }
  }

  /**
   * Determine what action was taken based on enforcement level
   */
  private getActionTaken(
    enforcementLevel: string,
    escalateOnViolation: boolean
  ): string {
    if (escalateOnViolation) {
      return 'escalated';
    }

    switch (enforcementLevel) {
      case 'block':
        return 'blocked';
      case 'warn':
        return 'allowed_with_warning';
      case 'log':
        return 'logged_only';
      default:
        return 'logged_only';
    }
  }

  /**
   * Get violation statistics for an agent
   */
  async getViolationStats(
    agentName: string,
    workspaceId: string,
    hoursAgo: number = 24
  ): Promise<{
    total_violations: number;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
    blocked_count: number;
    escalated_count: number;
  }> {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('agent_rule_violations')
        .select('*')
        .eq('agent_name', agentName)
        .eq('workspace_id', workspaceId)
        .gte('violated_at', since);

      if (error) {
throw error;
}

      if (!data || data.length === 0) {
        return {
          total_violations: 0,
          by_severity: {},
          by_type: {},
          blocked_count: 0,
          escalated_count: 0
        };
      }

      const bySeverity: Record<string, number> = {};
      const byType: Record<string, number> = {};
      let blockedCount = 0;
      let escalatedCount = 0;

      data.forEach(v => {
        bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
        byType[v.violation_type] = (byType[v.violation_type] || 0) + 1;
        if (v.action_taken === 'blocked') {
blockedCount++;
}
        if (v.action_taken === 'escalated') {
escalatedCount++;
}
      });

      return {
        total_violations: data.length,
        by_severity: bySeverity,
        by_type: byType,
        blocked_count: blockedCount,
        escalated_count: escalatedCount
      };
    } catch (err) {
      console.error('Failed to get violation stats:', err);
      throw err;
    }
  }
}

// Singleton instance
let instance: RulesEngine | null = null;

export function getRulesEngine(): RulesEngine {
  if (!instance) {
    instance = new RulesEngine();
  }
  return instance;
}

/**
 * Agent SDK Hook: Validate against rules before tool use
 * Usage in Agent SDK options:
 *
 * hooks: {
 *   PreToolUse: [createRulesValidationHook(workspaceId, agentName)]
 * }
 */
export function createRulesValidationHook(workspaceId: string, agentName: string) {
  const engine = getRulesEngine();

  return async (input: any, toolUseId: string, context: any) => {
    try {
      const validationContext: ValidationContext = {
        agent_name: agentName,
        workspace_id: workspaceId,
        action_type: context?.action_type || 'unknown',
        action_data: context?.action_data || {},
        execution_id: context?.execution_id
      };

      const result = await engine.validateAction(validationContext);

      if (!result.allowed) {
        // Block the action
        return {
          blocked: true,
          reason: `Rule violation: ${result.violations.map(v => v.message).join(', ')}`,
          violations: result.violations
        };
      }

      if (result.violations.length > 0 && result.enforcement === 'warn') {
        console.warn(`⚠️ Rule violations (warnings):`, result.violations);
      }
    } catch (err) {
      console.error('RulesValidationHook error:', err);
    }

    return {}; // Allow action to proceed
  };
}
