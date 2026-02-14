/**
 * Agent Escalation Protocol (Agents Protocol v1.0)
 *
 * Automated escalation triggers and management. An agent MUST escalate when:
 * - Confidence drops below threshold (default: 0.5)
 * - Consecutive error count exceeds threshold (default: 3)
 * - Execution time exceeds limit
 * - Task requires capabilities outside the agent's card
 * - Safety/ethical boundary is triggered (immediate → human)
 *
 * Escalation chain:
 *   Worker Agent → Orchestrator → Human Operator
 *
 * Escalations MUST NOT skip levels unless trigger is safety/ethical.
 */

import { randomUUID } from 'crypto';
import {
  createEscalationMessage,
  type AgentMessage,
  type EscalationPayload,
} from './messages';
import { agentEventLogger } from './events';

// ============================================================================
// Types
// ============================================================================

export type EscalationCondition =
  | 'confidence_threshold'
  | 'error_count'
  | 'execution_time'
  | 'capability_boundary'
  | 'safety_concern'
  | 'ambiguity'
  | 'resource_exhaustion';

export type EscalationSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EscalationStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface EscalationRule {
  /** Unique rule identifier */
  id: string;
  /** Condition type that triggers this rule */
  condition: EscalationCondition;
  /** Threshold value */
  threshold: number;
  /** Agent ID to escalate to */
  targetAgentId: string;
  /** Severity of the escalation */
  severity: EscalationSeverity;
  /** Whether this rule is active */
  enabled: boolean;
  /** Description of what this rule does */
  description?: string;
}

export interface EscalationMetrics {
  /** Current confidence score (0-1) */
  confidenceScore: number;
  /** Number of errors in current execution */
  errorCount: number;
  /** Elapsed execution time in milliseconds */
  executionTimeMs: number;
  /** Custom metrics for specialized rules */
  custom?: Record<string, number>;
}

export interface EscalationTrigger {
  /** Unique trigger identifier */
  triggerId: string;
  /** Agent that triggered the escalation */
  agentId: string;
  /** Rule that was triggered */
  rule: EscalationRule;
  /** Current metric value that triggered the rule */
  currentValue: number;
  /** Threshold that was exceeded */
  threshold: number;
  /** Timestamp when triggered */
  triggeredAt: string;
  /** Current status */
  status: EscalationStatus;
  /** The escalation message generated */
  message: AgentMessage<EscalationPayload>;
  /** Resolution details (when resolved) */
  resolution?: {
    resolvedAt: string;
    resolvedBy: string;
    action: string;
  };
}

// ============================================================================
// Escalation Manager
// ============================================================================

export class EscalationManager {
  private rules: Map<string, EscalationRule[]> = new Map();
  private activeTriggers: Map<string, EscalationTrigger> = new Map();

  /**
   * Register escalation rules for an agent
   */
  registerRules(agentId: string, rules: EscalationRule[]): void {
    this.rules.set(agentId, rules);
  }

  /**
   * Get registered rules for an agent
   */
  getRules(agentId: string): EscalationRule[] {
    return this.rules.get(agentId) || [];
  }

  /**
   * Generate default escalation rules for any agent
   */
  getDefaultRules(agentId: string): EscalationRule[] {
    return [
      {
        id: `${agentId}-low-confidence`,
        condition: 'confidence_threshold',
        threshold: 0.5,
        targetAgentId: 'orchestrator',
        severity: 'medium',
        enabled: true,
        description: 'Escalate when confidence drops below 0.5',
      },
      {
        id: `${agentId}-very-low-confidence`,
        condition: 'confidence_threshold',
        threshold: 0.3,
        targetAgentId: 'orchestrator',
        severity: 'high',
        enabled: true,
        description: 'Urgently escalate when confidence drops below 0.3',
      },
      {
        id: `${agentId}-error-count`,
        condition: 'error_count',
        threshold: 3,
        targetAgentId: 'orchestrator',
        severity: 'high',
        enabled: true,
        description: 'Escalate after 3 consecutive errors',
      },
      {
        id: `${agentId}-timeout`,
        condition: 'execution_time',
        threshold: 300_000, // 5 minutes
        targetAgentId: 'orchestrator',
        severity: 'high',
        enabled: true,
        description: 'Escalate if execution exceeds 5 minutes',
      },
      {
        id: `${agentId}-safety`,
        condition: 'safety_concern',
        threshold: 1, // Any safety concern triggers
        targetAgentId: 'orchestrator',
        severity: 'critical',
        enabled: true,
        description: 'Immediately escalate any safety concern',
      },
    ];
  }

  /**
   * Check if any escalation rules are triggered for the given metrics.
   * Returns the first triggered escalation or null.
   */
  checkEscalation(
    agentId: string,
    metrics: EscalationMetrics,
    workspaceId: string,
    context: Record<string, unknown> = {}
  ): EscalationTrigger | null {
    const agentRules = this.rules.get(agentId);
    if (!agentRules || agentRules.length === 0) return null;

    for (const rule of agentRules) {
      if (!rule.enabled) continue;

      const result = this.evaluateRule(rule, metrics);

      if (result.triggered) {
        const trigger = this.createTrigger(
          agentId,
          rule,
          result.currentValue,
          result.reason,
          workspaceId,
          context
        );

        // Log the escalation event
        agentEventLogger.logEscalation(agentId, workspaceId, {
          trigger: rule.condition,
          severity: rule.severity,
          targetAgentId: rule.targetAgentId,
          currentValue: result.currentValue,
          threshold: rule.threshold,
          reason: result.reason,
        });

        return trigger;
      }
    }

    return null;
  }

  /**
   * Evaluate a single rule against metrics
   */
  private evaluateRule(
    rule: EscalationRule,
    metrics: EscalationMetrics
  ): { triggered: boolean; currentValue: number; reason: string } {
    switch (rule.condition) {
      case 'confidence_threshold':
        return {
          triggered: metrics.confidenceScore < rule.threshold,
          currentValue: metrics.confidenceScore,
          reason: `Confidence (${metrics.confidenceScore.toFixed(2)}) below threshold (${rule.threshold})`,
        };

      case 'error_count':
        return {
          triggered: metrics.errorCount >= rule.threshold,
          currentValue: metrics.errorCount,
          reason: `Error count (${metrics.errorCount}) reached threshold (${rule.threshold})`,
        };

      case 'execution_time':
        return {
          triggered: metrics.executionTimeMs >= rule.threshold,
          currentValue: metrics.executionTimeMs,
          reason: `Execution time (${metrics.executionTimeMs}ms) exceeded limit (${rule.threshold}ms)`,
        };

      case 'safety_concern':
        // Safety is binary - any safety metric > 0 triggers
        const safetyValue = metrics.custom?.safetyScore ?? 0;
        return {
          triggered: safetyValue >= rule.threshold,
          currentValue: safetyValue,
          reason: `Safety concern detected (score: ${safetyValue})`,
        };

      case 'capability_boundary':
        const capValue = metrics.custom?.capabilityMismatch ?? 0;
        return {
          triggered: capValue >= rule.threshold,
          currentValue: capValue,
          reason: 'Task requires capabilities outside agent boundaries',
        };

      case 'ambiguity':
        const ambiguityValue = metrics.custom?.ambiguityScore ?? 0;
        return {
          triggered: ambiguityValue >= rule.threshold,
          currentValue: ambiguityValue,
          reason: `Ambiguous instructions detected (score: ${ambiguityValue})`,
        };

      case 'resource_exhaustion':
        const resourceValue = metrics.custom?.resourceUsage ?? 0;
        return {
          triggered: resourceValue >= rule.threshold,
          currentValue: resourceValue,
          reason: `Resource usage (${resourceValue}%) exceeded threshold (${rule.threshold}%)`,
        };

      default:
        return { triggered: false, currentValue: 0, reason: '' };
    }
  }

  /**
   * Create an escalation trigger and message
   */
  private createTrigger(
    agentId: string,
    rule: EscalationRule,
    currentValue: number,
    reason: string,
    workspaceId: string,
    context: Record<string, unknown>
  ): EscalationTrigger {
    const message = createEscalationMessage(
      agentId,
      rule.targetAgentId,
      {
        reason,
        severity: rule.severity,
        trigger: rule.condition as EscalationPayload['trigger'],
        context,
        errorDetails: { currentValue, threshold: rule.threshold, ruleId: rule.id },
        impact: `Agent ${agentId} cannot continue reliably. ${rule.description || ''}`,
      },
      workspaceId
    );

    const trigger: EscalationTrigger = {
      triggerId: randomUUID(),
      agentId,
      rule,
      currentValue,
      threshold: rule.threshold,
      triggeredAt: new Date().toISOString(),
      status: 'active',
      message,
    };

    this.activeTriggers.set(trigger.triggerId, trigger);
    return trigger;
  }

  /**
   * Acknowledge an escalation (someone is looking at it)
   */
  acknowledge(triggerId: string): void {
    const trigger = this.activeTriggers.get(triggerId);
    if (trigger) {
      trigger.status = 'acknowledged';
    }
  }

  /**
   * Resolve an escalation
   */
  resolve(triggerId: string, resolvedBy: string, action: string): void {
    const trigger = this.activeTriggers.get(triggerId);
    if (trigger) {
      trigger.status = 'resolved';
      trigger.resolution = {
        resolvedAt: new Date().toISOString(),
        resolvedBy,
        action,
      };
    }
  }

  /**
   * Dismiss an escalation (determined to be non-issue)
   */
  dismiss(triggerId: string): void {
    const trigger = this.activeTriggers.get(triggerId);
    if (trigger) {
      trigger.status = 'dismissed';
    }
  }

  /**
   * Get active (unresolved) escalations for an agent
   */
  getActiveEscalations(agentId?: string): EscalationTrigger[] {
    const triggers = Array.from(this.activeTriggers.values());
    const active = triggers.filter((t) => t.status === 'active' || t.status === 'acknowledged');

    if (agentId) {
      return active.filter((t) => t.agentId === agentId);
    }
    return active;
  }

  /**
   * Get escalation history for an agent
   */
  getEscalationHistory(agentId: string): EscalationTrigger[] {
    return Array.from(this.activeTriggers.values()).filter((t) => t.agentId === agentId);
  }

  /**
   * Clear resolved/dismissed escalations (housekeeping)
   */
  clearResolved(): number {
    let cleared = 0;
    for (const [id, trigger] of this.activeTriggers) {
      if (trigger.status === 'resolved' || trigger.status === 'dismissed') {
        this.activeTriggers.delete(id);
        cleared++;
      }
    }
    return cleared;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const escalationManager = new EscalationManager();
