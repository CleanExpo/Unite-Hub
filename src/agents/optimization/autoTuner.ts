/**
 * Auto-Tuner
 *
 * Automatically adjusts agent parameters based on optimization suggestions.
 * Respects safety limits and only auto-applies low-risk changes.
 * High-risk changes are flagged for founder approval.
 */

import { generateOptimizationSuggestions } from './optimizationEngine';
import {
  defaultRiskSafetyProfile,
  requiresFounderApproval,
  applySafetyConstraints,
  RiskSafetyProfile,
} from './safetyLimits';
import { logFounderEvent } from '@/lib/founder/founderEventLog';

export interface TuningChange {
  id: string;
  createdAt: string;
  agent: string;
  param: string;
  oldValue: number | string | boolean | null;
  newValue: number | string | boolean | null;
  reason: string;
  autoApplied: boolean;
  requiresFounderApproval: boolean;
  confidence?: number;
}

// In-memory tuning profile store (would persist to database)
let tuningProfile: Record<string, Record<string, any>> = {};

// Track applied changes for audit trail
let changeHistory: TuningChange[] = [];

/**
 * Get tuning profile for an agent
 */
export function getTuningProfile(agent: string): Record<string, any> {
  return tuningProfile[agent] ?? {};
}

/**
 * Apply a tuning change (either auto or pending approval)
 */
export function applyTuning(
  agent: string,
  param: string,
  value: any,
  reason: string,
  riskLevel: 'low' | 'medium' | 'high',
  profile: RiskSafetyProfile = defaultRiskSafetyProfile,
  confidence = 0.75
): TuningChange {
  // Apply safety constraints
  const constrainedValue = typeof value === 'number' ? applySafetyConstraints(param, value, profile) : value;

  // Determine if auto-approval allowed
  const needsApproval = requiresFounderApproval(riskLevel, profile);
  const autoAllowed = !needsApproval;

  // Get old value for audit trail
  const existing = tuningProfile[agent] ?? {};
  const oldValue = existing[param] ?? null;

  const change: TuningChange = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    agent,
    param,
    oldValue,
    newValue: constrainedValue,
    reason,
    autoApplied: autoAllowed,
    requiresFounderApproval: needsApproval,
    confidence,
  };

  // Apply immediately if auto-allowed
  if (autoAllowed) {
    tuningProfile[agent] = { ...existing, [param]: constrainedValue };
    logFounderEvent({
      timestamp: change.createdAt,
      event: 'agent_action',
      actor: 'optimization_auto_tuner',
      data: {
        action: 'auto_tuning_applied',
        change,
      },
    });
  } else {
    // Log for founder approval
    logFounderEvent({
      timestamp: change.createdAt,
      event: 'agent_action',
      actor: 'optimization_auto_tuner',
      data: {
        action: 'tuning_pending_approval',
        change,
      },
    });
  }

  changeHistory.push(change);
  return change;
}

/**
 * Run the auto-tuner with current suggestions
 */
export function runAutoTuner(profile: RiskSafetyProfile = defaultRiskSafetyProfile): TuningChange[] {
  const suggestions = generateOptimizationSuggestions();
  const changes: TuningChange[] = [];

  // Process suggestions into tuning changes
  for (const suggestion of suggestions) {
    let param = suggestion.area;
    let value: any = null;

    // Map suggestion area to specific parameters
    if (suggestion.area === 'reward') {
      param = 'prompt_temperature';
      value = 0.7; // Moderate temperature for balanced outputs
    } else if (suggestion.area === 'performance') {
      param = 'batch_size';
      value = 32; // Smaller batches = lower latency
    } else if (suggestion.area === 'efficiency') {
      param = 'parallelization_factor';
      value = 0.8; // Increase parallelization
    } else if (suggestion.area === 'risk_response') {
      param = 'priority_boost';
      value = 2; // Double priority for risk responses
    }

    if (value !== null) {
      const riskLevel: 'low' | 'medium' | 'high' = suggestion.requiresFounderApproval ? 'high' : 'low';

      const change = applyTuning(
        suggestion.agent,
        param,
        value,
        suggestion.suggestion,
        riskLevel,
        profile,
        suggestion.confidence
      );

      changes.push(change);
    }
  }

  return changes;
}

/**
 * Approve a pending tuning change (founder action)
 */
export function approveTuningChange(changeId: string, profile: RiskSafetyProfile = defaultRiskSafetyProfile): boolean {
  const change = changeHistory.find(c => c.id === changeId);
  if (!change || change.autoApplied) return false;

  // Apply the change
  tuningProfile[change.agent] = {
    ...(tuningProfile[change.agent] ?? {}),
    [change.param]: change.newValue,
  };

  change.autoApplied = true;
  change.requiresFounderApproval = false;

  logFounderEvent({
    timestamp: new Date().toISOString(),
    event: 'founder_action',
    actor: 'founder',
    data: {
      action: 'tuning_approved',
      changeId,
      change,
    },
  });

  return true;
}

/**
 * Reject a pending tuning change (founder action)
 */
export function rejectTuningChange(changeId: string, reason: string): boolean {
  const change = changeHistory.find(c => c.id === changeId);
  if (!change || change.autoApplied) return false;

  change.requiresFounderApproval = false;

  logFounderEvent({
    timestamp: new Date().toISOString(),
    event: 'founder_action',
    actor: 'founder',
    data: {
      action: 'tuning_rejected',
      changeId,
      reason,
    },
  });

  return true;
}

/**
 * Get pending changes awaiting approval
 */
export function getPendingChanges(): TuningChange[] {
  return changeHistory.filter(c => c.requiresFounderApproval);
}

/**
 * Get all tuning changes (history)
 */
export function getTuningHistory(agent?: string): TuningChange[] {
  if (agent) {
    return changeHistory.filter(c => c.agent === agent);
  }
  return changeHistory;
}

/**
 * Get tuning statistics
 */
export function getTuningStats() {
  const total = changeHistory.length;
  const applied = changeHistory.filter(c => c.autoApplied).length;
  const pending = changeHistory.filter(c => c.requiresFounderApproval).length;
  const rejected = total - applied - pending;

  return {
    totalChanges: total,
    autoApplied: applied,
    pendingApproval: pending,
    rejected,
    autoApprovalRate: total > 0 ? (applied / total) * 100 : 0,
  };
}
