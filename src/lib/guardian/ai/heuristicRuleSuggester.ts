/**
 * H01 Heuristic Rule Suggestion Engine
 *
 * Provides deterministic, non-AI rule suggestions based on threshold patterns.
 * These serve as fallback suggestions when AI is disabled or as baseline suggestions.
 */

import type { RuleSuggestionSignals } from './ruleSuggestionSignals';

export interface HeuristicSuggestion {
  title: string;
  rationale: string;
  confidence: number;
  signals: Record<string, unknown>;
  ruleDraft: Record<string, unknown>;
  source: 'heuristic';
}

/**
 * Derive heuristic rule suggestions from PII-free signals
 */
export function deriveHeuristicSuggestions(signals: RuleSuggestionSignals): HeuristicSuggestion[] {
  const suggestions: HeuristicSuggestion[] = [];

  // T1: Burst alert suppression
  if (signals.alertRates.count24h > 100) {
    const avgPerHour = signals.alertRates.avgPerHour24h;
    if (avgPerHour > 5) {
      suggestions.push({
        title: 'Burst alert suppression rule',
        rationale: `Alert volume is high (${signals.alertRates.count24h} in 24h, avg ${avgPerHour.toFixed(1)}/hour). Consider a cooldown rule to suppress duplicate firing within a window.`,
        confidence: 0.65,
        signals: {
          alertCount24h: signals.alertRates.count24h,
          avgPerHour: avgPerHour,
        },
        ruleDraft: {
          name: 'Suppress burst alerts - auto draft',
          type: 'suppression',
          description: 'Auto-generated: suppress alerts from same rule firing >5 times/hour',
          config: {
            suppression_type: 'cooldown',
            cooldown_seconds: 300, // 5-minute cooldown
            apply_to_rule_keys: signals.topRules.slice(0, 3).map((r) => r.ruleKey),
          },
          enabled: false, // Always draft, never auto-enable
        },
        source: 'heuristic',
      });
    }
  }

  // T2: Notification failure guard
  if (signals.notificationFailureRates.failurePercent > 10) {
    suggestions.push({
      title: 'Notification failure guard rule',
      rationale: `Notification failures are ${signals.notificationFailureRates.failurePercent.toFixed(1)}% of attempts (${signals.notificationFailureRates.failureCount24h} failures in 24h). Consider an alert rule to catch delivery issues.`,
      confidence: 0.7,
      signals: {
        failureCount24h: signals.notificationFailureRates.failureCount24h,
        failurePercent: signals.notificationFailureRates.failurePercent,
        topFailedChannels: signals.notificationFailureRates.topFailedChannels?.slice(0, 3),
      },
      ruleDraft: {
        name: 'Notification delivery monitoring - auto draft',
        type: 'threshold',
        description: 'Auto-generated: alert on notification delivery failures',
        config: {
          metric: 'notification_failure_rate',
          threshold: 0.1, // 10%
          window_seconds: 3600, // 1 hour
          severity: 'high',
        },
        enabled: false,
      },
      source: 'heuristic',
    });
  }

  // T3: Risk spike monitor
  if (signals.riskSnapshot.maxScore >= 80) {
    suggestions.push({
      title: 'Risk spike monitor rule',
      rationale: `Current max risk score is ${signals.riskSnapshot.maxScore}, indicating high-risk alerts. Consider a rule to monitor for risk score spikes.`,
      confidence: 0.6,
      signals: {
        maxRiskScore: signals.riskSnapshot.maxScore,
        avgRiskScore: signals.riskSnapshot.avgScore,
        scoreDistribution: signals.riskSnapshot.scoreDistribution,
      },
      ruleDraft: {
        name: 'Risk spike detector - auto draft',
        type: 'threshold',
        description: 'Auto-generated: alert when risk score exceeds threshold',
        config: {
          metric: 'risk_score',
          threshold: 80,
          window_seconds: 1800, // 30 minutes
          severity: 'critical',
        },
        enabled: false,
      },
      source: 'heuristic',
    });
  }

  // T4: Incident correlation gap
  if (signals.correlationStats.clusterCount > 0 && signals.correlationStats.linkRatePercent < 50) {
    suggestions.push({
      title: 'Incident correlation rule',
      rationale: `Found ${signals.correlationStats.clusterCount} correlation clusters with low link rate (${signals.correlationStats.linkRatePercent.toFixed(1)}%). Consider a rule to auto-create incidents for correlated alerts.`,
      confidence: 0.55,
      signals: {
        clusterCount: signals.correlationStats.clusterCount,
        avgClusterSize: signals.correlationStats.avgClusterSize,
        linkRatePercent: signals.correlationStats.linkRatePercent,
      },
      ruleDraft: {
        name: 'Correlation-based incident creation - auto draft',
        type: 'correlation',
        description: 'Auto-generated: create incident when alerts correlate',
        config: {
          min_cluster_size: 3,
          correlation_window_seconds: 600, // 10 minutes
          auto_create_incident: false, // Manual decision required
        },
        enabled: false,
      },
      source: 'heuristic',
    });
  }

  // T5: Low-traffic rule cleanup suggestion
  if (signals.topRules.length > 0 && signals.topRules[signals.topRules.length - 1].alertCount < 1) {
    suggestions.push({
      title: 'Rule hygiene check',
      rationale: `Found rules with no recent alerts. Consider reviewing low-activity rules for cleanup or tuning.`,
      confidence: 0.5,
      signals: {
        inactiveRuleCount: signals.topRules.filter((r) => r.alertCount === 0).length,
        allRulesChecked: signals.topRules.length,
      },
      ruleDraft: {
        name: 'Rule maintenance note - auto draft',
        type: 'maintenance',
        description: 'Auto-generated: reminder to review low-activity rules',
        config: {
          review_reason: 'low_activity',
          note: 'Review and tune or disable rules with minimal alerts',
        },
        enabled: false,
      },
      source: 'heuristic',
    });
  }

  return suggestions;
}

/**
 * Validate a rule draft for basic shape compliance
 */
export function validateRuleDraft(ruleDraft: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ruleDraft || typeof ruleDraft !== 'object') {
    errors.push('ruleDraft must be a non-null object');
    return { valid: false, errors };
  }

  const draft = ruleDraft as Record<string, unknown>;

  // Check required fields
  if (!draft.name || typeof draft.name !== 'string') {
    errors.push('ruleDraft.name must be a non-empty string');
  }

  if (!draft.type || typeof draft.type !== 'string') {
    errors.push('ruleDraft.type must be a non-empty string');
  }

  // Check for prohibited fields
  const prohibitedFields = [
    'email',
    'webhook_url',
    'api_key',
    'secret',
    'token',
    'password',
    'raw_event',
    'payload_raw',
    'body_raw',
  ];

  for (const field of prohibitedFields) {
    if (field in draft) {
      errors.push(`ruleDraft contains prohibited field: ${field}`);
    }
    if (draft.config && typeof draft.config === 'object' && field in (draft.config as Record<string, unknown>)) {
      errors.push(`ruleDraft.config contains prohibited field: ${field}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
