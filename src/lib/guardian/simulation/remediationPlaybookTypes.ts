/**
 * Guardian I04: Remediation Playbook DSL Types & Validation
 *
 * Defines the typed DSL for proposed remediation actions.
 * Supported actions:
 * - adjust_rule_threshold: Modify rule severity/threshold
 * - disable_rule: Disable a specific rule
 * - adjust_correlation_window: Change correlation time window
 * - increase_min_link_count: Raise minimum links for incident correlation
 * - suppress_notification_channel: Suppress notifications on specific channel
 *
 * All actions are allow-listed with parameter bounds validation.
 * No production Guardian tables modified; simulation only.
 */

/**
 * Adjustment action: modify rule severity/threshold
 */
export interface AdjustRuleThresholdAction {
  type: 'adjust_rule_threshold';
  rule_id: string;
  metric: 'severity' | 'threshold' | 'confidence';
  delta: number; // Percentage change: -50 to +50
}

/**
 * Disablement action: disable a rule entirely
 */
export interface DisableRuleAction {
  type: 'disable_rule';
  rule_id: string;
}

/**
 * Correlation window adjustment: widen or narrow the correlation time window
 */
export interface AdjustCorrelationWindowAction {
  type: 'adjust_correlation_window';
  window_minutes_delta: number; // -30 to +120 minutes
}

/**
 * Correlation link count adjustment: increase minimum links required for incident
 */
export interface IncreaseMinLinkCountAction {
  type: 'increase_min_link_count';
  delta: number; // +1 to +5 links
}

/**
 * Notification suppression: suppress notifications on specific channel
 */
export interface SuppressNotificationChannelAction {
  type: 'suppress_notification_channel';
  channel: 'email' | 'slack' | 'webhook' | 'pagerduty';
  duration_minutes: number; // 15 to 1440 (24 hours)
}

/**
 * Union of all supported remediation actions
 */
export type GuardianRemediationAction =
  | AdjustRuleThresholdAction
  | DisableRuleAction
  | AdjustCorrelationWindowAction
  | IncreaseMinLinkCountAction
  | SuppressNotificationChannelAction;

/**
 * Full remediation playbook configuration
 */
export interface GuardianRemediationPlaybookConfig {
  actions: GuardianRemediationAction[];
  notes?: string;
}

/**
 * Runtime validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate individual action parameters
 */
export function validateAction(action: unknown): ValidationResult {
  if (!action || typeof action !== 'object') {
    return { valid: false, errors: ['Action must be a non-null object'] };
  }

  const act = action as Record<string, unknown>;
  const errors: string[] = [];

  const type = act.type;
  if (!type || typeof type !== 'string') {
    return { valid: false, errors: ['Action must have a type field'] };
  }

  if (!['adjust_rule_threshold', 'disable_rule', 'adjust_correlation_window', 'increase_min_link_count', 'suppress_notification_channel'].includes(type)) {
    return { valid: false, errors: [`Unknown action type: ${type}`] };
  }

  // Validate based on type
  switch (type) {
    case 'adjust_rule_threshold': {
      if (!act.rule_id || typeof act.rule_id !== 'string') {
errors.push('adjust_rule_threshold: rule_id must be string');
}
      if (!['severity', 'threshold', 'confidence'].includes(act.metric as string)) {
errors.push('adjust_rule_threshold: metric must be severity/threshold/confidence');
}
      const delta = act.delta as number;
      if (typeof delta !== 'number' || delta < -50 || delta > 50) {
errors.push('adjust_rule_threshold: delta must be number in range [-50, 50]');
}
      break;
    }

    case 'disable_rule': {
      if (!act.rule_id || typeof act.rule_id !== 'string') {
errors.push('disable_rule: rule_id must be string');
}
      break;
    }

    case 'adjust_correlation_window': {
      const delta = act.window_minutes_delta as number;
      if (typeof delta !== 'number' || delta < -30 || delta > 120) {
errors.push('adjust_correlation_window: window_minutes_delta must be number in range [-30, 120]');
}
      break;
    }

    case 'increase_min_link_count': {
      const delta = act.delta as number;
      if (typeof delta !== 'number' || delta < 1 || delta > 5) {
errors.push('increase_min_link_count: delta must be number in range [1, 5]');
}
      break;
    }

    case 'suppress_notification_channel': {
      if (!['email', 'slack', 'webhook', 'pagerduty'].includes(act.channel as string)) {
errors.push('suppress_notification_channel: channel must be email/slack/webhook/pagerduty');
}
      const duration = act.duration_minutes as number;
      if (typeof duration !== 'number' || duration < 15 || duration > 1440) {
errors.push('suppress_notification_channel: duration_minutes must be number in range [15, 1440]');
}
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate entire playbook configuration
 */
export function validatePlaybookConfig(config: unknown): ValidationResult {
  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be a non-null object'] };
  }

  const cfg = config as Record<string, unknown>;
  const errors: string[] = [];

  // Validate actions array
  if (!Array.isArray(cfg.actions)) {
    return { valid: false, errors: ['Config must have an actions array'] };
  }

  if (cfg.actions.length === 0) {
    errors.push('Playbook must have at least one action');
  }

  if (cfg.actions.length > 20) {
    errors.push('Playbook can have at most 20 actions');
  }

  // Validate each action
  for (let i = 0; i < cfg.actions.length; i++) {
    const result = validateAction(cfg.actions[i]);
    if (!result.valid) {
      errors.push(`Action ${i}: ${result.errors.join('; ')}`);
    }
  }

  // Validate notes (optional string)
  if (cfg.notes !== undefined && typeof cfg.notes !== 'string') {
    errors.push('notes must be a string');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard for remediation action
 */
export function isRemediationAction(action: unknown): action is GuardianRemediationAction {
  const result = validateAction(action);
  return result.valid;
}

/**
 * Get action description for UI/logging
 */
export function describeAction(action: GuardianRemediationAction): string {
  switch (action.type) {
    case 'adjust_rule_threshold':
      return `Adjust ${action.metric} of rule ${action.rule_id} by ${action.delta > 0 ? '+' : ''}${action.delta}%`;
    case 'disable_rule':
      return `Disable rule ${action.rule_id}`;
    case 'adjust_correlation_window':
      return `Adjust correlation window by ${action.window_minutes_delta > 0 ? '+' : ''}${action.window_minutes_delta} minutes`;
    case 'increase_min_link_count':
      return `Increase minimum link count by ${action.delta}`;
    case 'suppress_notification_channel':
      return `Suppress ${action.channel} notifications for ${action.duration_minutes} minutes`;
    default:
      return 'Unknown action';
  }
}
