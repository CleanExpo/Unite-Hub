/**
 * Phase 13 – Safety Context Filter
 *
 * Prevent unsafe suggestions based on real-world context.
 * Integrates with Phase 13 visual + situational awareness to block dangerous advice.
 *
 * - Detect: walking near traffic, driving, operating machinery, in meeting
 * - Prevent: dangerous movement suggestions, distraction-inducing interactions
 * - Graceful degradation: Allow safe alternatives instead of blocking
 * - Advisory: Warn about risky times for complex decisions
 *
 * Integration: Receives SituationSnapshot from contextFusionEngine
 * Feeds: realtimeDialogueOrchestrator safety checks, advisors for decision gating
 * Output: SafetyCheckResult with approved/modified/blocked status
 */

import type { SituationSnapshot } from './contextFusionEngine';
import type { SurroundingsInsight } from './surroundingsReasoner';

// ============================================================================
// SAFETY FILTER TYPES
// ============================================================================

export type SafetyBlockReason =
  | 'driving'
  | 'walking_traffic'
  | 'machinery_operation'
  | 'in_meeting'
  | 'high_cognitive_load'
  | 'elevated_stress'
  | 'low_energy'
  | 'safety_hazard'
  | 'risky_decision_context';

export interface SafetyCheckResult {
  // Decision
  isSafe: boolean; // true = approved, false = needs modification or blocking
  blockReason?: SafetyBlockReason;

  // Recommendation
  action: 'approve' | 'modify' | 'warn' | 'block';
  modifiedSuggestion?: string; // Alternative safe suggestion if blocked
  warning?: string; // Advisory message

  // Context
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;

  // Confidence
  confidence: number; // 0-1
}

// ============================================================================
// SAFETY CHECK RULES
// ============================================================================

/**
 * Check if suggestion is safe given current situation
 */
export function checkSafetyInContext(
  suggestion: string,
  snapshot: SituationSnapshot,
  surroundings?: SurroundingsInsight
): SafetyCheckResult {
  const riskFactors: SafetyCheckResult['riskFactors'] = [];

  // Check driving situation
  if (snapshot.likelyActivity === 'commuting' && snapshot.environmentType === 'car') {
    return {
      isSafe: false,
      blockReason: 'driving',
      action: 'block',
      riskLevel: 'critical',
      warning: 'Cannot provide complex advice while driving. Please pull over or wait until stopped.',
      modifiedSuggestion: 'I can provide a brief summary. For details, please review when you reach your destination.',
      riskFactors: [
        {
          factor: 'Operating vehicle',
          severity: 'critical',
          mitigation: 'Stop safely before attempting complex tasks',
        },
      ],
      confidence: 0.99,
    };
  }

  // Check walking in traffic
  if (
    snapshot.likelyActivity === 'commuting' &&
    snapshot.environmentType === 'street' &&
    surroundings?.safetyScore! < 50
  ) {
    riskFactors.push({
      factor: 'Traffic hazard',
      severity: 'high',
      mitigation: 'Move to safe location before engaging with complex content',
    });
  }

  // Check machinery operation
  if (surroundings?.hazardWarnings?.some((h) => h.type === 'machinery')) {
    return {
      isSafe: false,
      blockReason: 'machinery_operation',
      action: 'block',
      riskLevel: 'critical',
      warning: 'Cannot advise while operating machinery. Priority must be on safety.',
      riskFactors: [
        {
          factor: 'Machinery operation',
          severity: 'critical',
          mitigation: 'Complete current task safely before consulting',
        },
      ],
      confidence: 0.95,
    };
  }

  // Check in meeting (some suggestions inappropriate)
  if (snapshot.currentCalendarEvent?.title.toLowerCase().includes('meeting') || snapshot.likelyActivity === 'in_meeting') {
    if (isInappropriateForMeeting(suggestion)) {
      return {
        isSafe: false,
        blockReason: 'in_meeting',
        action: 'warn',
        riskLevel: 'medium',
        warning: 'This discussion is better handled outside the meeting. Continue with current agenda.',
        modifiedSuggestion: 'I can help with this after your meeting ends.',
        riskFactors: [
          {
            factor: 'Active meeting',
            severity: 'medium',
            mitigation: 'Schedule discussion for later',
          },
        ],
        confidence: 0.8,
      };
    }
  }

  // Check cognitive overload (risky for decisions)
  if (snapshot.cognitiveLoad === 'overloaded' && requiresComplexDecision(suggestion)) {
    riskFactors.push({
      factor: 'Cognitive overload',
      severity: 'high',
      mitigation: 'Take a break before making significant decisions',
    });
  }

  // Check elevated stress (risky for major decisions)
  if (
    snapshot.riskFlags.some((f) => f.type === 'autonomy' && f.severity === 'high') &&
    requiresMajorDecision(suggestion)
  ) {
    riskFactors.push({
      factor: 'Elevated stress',
      severity: 'high',
      mitigation: 'Consider grounding exercises before deciding',
    });
  }

  // Check low energy (risky for execution)
  if (snapshot.energyLevel === 'overloaded' || snapshot.energyLevel === 'fatigued') {
    if (requiresImmediateExecution(suggestion)) {
      riskFactors.push({
        factor: 'Low energy state',
        severity: 'medium',
        mitigation: 'Rest first; defer execution to tomorrow',
      });
    }
  }

  // Check general safety hazards
  if (surroundings?.safetyScore! < 40) {
    riskFactors.push({
      factor: 'Unsafe environment',
      severity: 'high',
      mitigation: 'Move to safe location first',
    });
  }

  // Aggregate findings
  if (riskFactors.length > 0) {
    const maxSeverity = getMaxSeverity(riskFactors);

    if (maxSeverity === 'high' && requiresMajorDecision(suggestion)) {
      return {
        isSafe: false,
        action: 'warn',
        riskLevel: 'high',
        warning: `Risky timing for this decision. ${riskFactors.map((f) => f.factor).join(', ')} detected.`,
        riskFactors,
        confidence: 0.85,
      };
    }

    return {
      isSafe: true,
      action: 'warn',
      riskLevel: 'medium',
      warning: `Proceed with caution. Note: ${riskFactors[0].factor}. ${riskFactors[0].mitigation}`,
      riskFactors,
      confidence: 0.75,
    };
  }

  // All clear
  return {
    isSafe: true,
    action: 'approve',
    riskLevel: 'low',
    riskFactors: [],
    confidence: 0.95,
  };
}

/**
 * Filter advisor suggestions before presentation
 */
export function filterAdvisorSuggestions(
  suggestions: string[],
  snapshot: SituationSnapshot,
  surroundings?: SurroundingsInsight
): {
  approvedSuggestions: string[];
  filteredSuggestions: Array<{
    suggestion: string;
    reason: SafetyBlockReason;
    alternative?: string;
  }>;
  overallWarning?: string;
} {
  const approved: string[] = [];
  const filtered: Array<{ suggestion: string; reason: SafetyBlockReason; alternative?: string }> = [];

  for (const suggestion of suggestions) {
    const check = checkSafetyInContext(suggestion, snapshot, surroundings);

    if (check.isSafe && check.action === 'approve') {
      approved.push(suggestion);
    } else if (check.blockReason) {
      filtered.push({
        suggestion,
        reason: check.blockReason,
        alternative: check.modifiedSuggestion,
      });
    }
  }

  let overallWarning: string | undefined;
  if (filtered.length > 0 && approved.length === 0) {
    overallWarning = 'Unable to provide suggestions in current context. Please wait for safer conditions.';
  } else if (filtered.length > 0) {
    overallWarning = `${filtered.length} suggestion(s) deferred due to current context.`;
  }

  return {
    approvedSuggestions: approved,
    filteredSuggestions: filtered,
    overallWarning,
  };
}

/**
 * Gate execution of autonomous actions based on safety
 */
export function canExecuteAutonomouslyNow(
  action: string,
  snapshot: SituationSnapshot,
  surroundings?: SurroundingsInsight
): {
  canExecute: boolean;
  reason: string;
  suggestedDelay?: number; // milliseconds until safe
} {
  // Never execute in unsafe conditions
  if (surroundings?.safetyScore! < 40) {
    return {
      canExecute: false,
      reason: 'Unsafe environment - defer execution',
      suggestedDelay: 5 * 60 * 1000, // Try again in 5 min
    };
  }

  // Never auto-execute while driving
  if (snapshot.likelyActivity === 'commuting' && snapshot.environmentType === 'car') {
    return {
      canExecute: false,
      reason: 'Cannot execute while driving',
      suggestedDelay: 30 * 60 * 1000, // Try when drive ends
    };
  }

  // Don't auto-execute in high cognitive load
  if (snapshot.cognitiveLoad === 'overloaded' && requiresMajorDecision(action)) {
    return {
      canExecute: false,
      reason: 'Cognitive overload - wait for clarity',
      suggestedDelay: 10 * 60 * 1000, // 10 min
    };
  }

  // Don't auto-execute during meetings (unless explicitly allowed)
  if (snapshot.likelyActivity === 'in_meeting') {
    return {
      canExecute: false,
      reason: 'In meeting - defer to later',
      suggestedDelay: 60 * 60 * 1000, // After meeting
    };
  }

  return {
    canExecute: true,
    reason: 'Context is safe for execution',
  };
}

/**
 * Check if action should wait for better circumstances
 */
export function shouldWaitForBetterTiming(
  action: string,
  snapshot: SituationSnapshot
): {
  shouldWait: boolean;
  reason: string;
  bestTimeWindow?: { start: string; end: string };
} {
  // If fatigued, suggest rest
  if (snapshot.energyLevel === 'fatigued') {
    return {
      shouldWait: true,
      reason: 'Low energy - rest first',
      bestTimeWindow: { start: '20:00', end: '22:00' }, // After rest
    };
  }

  // If stressed, suggest calming
  if (snapshot.riskFlags.some((f) => f.type === 'autonomy')) {
    return {
      shouldWait: true,
      reason: 'Elevated stress - try grounding exercises first',
    };
  }

  // If approaching busy time, start now
  if (snapshot.currentCalendarEvent && snapshot.currentCalendarEvent.timeUntilStart < 30 * 60 * 1000) {
    return {
      shouldWait: true,
      reason: `Meeting starting soon (${Math.round(snapshot.currentCalendarEvent.timeUntilStart / 60 / 1000)} min) - wait until later`,
    };
  }

  return {
    shouldWait: false,
    reason: 'Current timing is good',
  };
}

// ============================================================================
// HELPER PREDICATES
// ============================================================================

/**
 * Is this suggestion inappropriate for a meeting context?
 */
function isInappropriateForMeeting(suggestion: string): boolean {
  const inappropriatePatterns = [
    'leave the meeting',
    'skip',
    'cancel',
    'quit',
    'major decision',
    'execute immediately',
    'financial transaction',
    'resignation',
  ];

  const lower = suggestion.toLowerCase();
  return inappropriatePatterns.some((pattern) => lower.includes(pattern));
}

/**
 * Does this require complex decision-making?
 */
function requiresComplexDecision(suggestion: string): boolean {
  const patterns = ['decide', 'choose', 'opinion', 'strategy', 'plan', 'analysis'];
  const lower = suggestion.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

/**
 * Does this require a major life/business decision?
 */
function requiresMajorDecision(suggestion: string): boolean {
  const patterns = ['hire', 'fire', 'quit', 'change role', 'move', 'investment', 'commitment'];
  const lower = suggestion.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

/**
 * Does this require immediate execution?
 */
function requiresImmediateExecution(suggestion: string): boolean {
  const patterns = ['now', 'immediately', 'urgent', 'execute', 'start', 'begin'];
  const lower = suggestion.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

/**
 * Get maximum severity from risk factors
 */
function getMaxSeverity(
  factors: Array<{ severity: 'low' | 'medium' | 'high' }>
): 'low' | 'medium' | 'high' {
  if (factors.some((f) => f.severity === 'high')) return 'high';
  if (factors.some((f) => f.severity === 'medium')) return 'medium';
  return 'low';
}

// ============================================================================
// INTERRUPTION & DISTRACTION DETECTION
// ============================================================================

/**
 * Should this interrupt Phill's current focus?
 */
export function isAppropriateInterruption(
  messageType: string,
  snapshot: SituationSnapshot,
  surroundings?: SurroundingsInsight
): {
  appropriate: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
} {
  // Critical messages always interrupt
  if (messageType === 'emergency' || messageType === 'critical') {
    return {
      appropriate: true,
      severity: 'critical',
      recommendation: 'Interrupt immediately',
    };
  }

  // Don't interrupt during deep focus
  if (surroundings?.focusScore! > 80 && messageType !== 'urgent') {
    return {
      appropriate: false,
      severity: 'low',
      recommendation: 'Queue for later; Phill is in deep focus',
    };
  }

  // Don't interrupt during important meetings
  if (snapshot.likelyActivity === 'in_meeting' && messageType !== 'emergency') {
    return {
      appropriate: false,
      severity: 'low',
      recommendation: 'Defer until meeting ends',
    };
  }

  // Reduce interruptions when stressed/fatigued
  if (
    (snapshot.energyLevel === 'fatigued' || snapshot.cognitiveLoad === 'overloaded') &&
    messageType === 'low'
  ) {
    return {
      appropriate: false,
      severity: 'low',
      recommendation: 'Let rest; defer non-urgent messages',
    };
  }

  return {
    appropriate: true,
    severity: messageType === 'urgent' ? 'high' : 'medium',
    recommendation: 'Appropriate to interrupt',
  };
}

// ============================================================================
// COMPLIANCE & AUDIT
// ============================================================================

/**
 * Generate audit entry for safety decision
 */
export function createAuditEntry(
  action: string,
  result: SafetyCheckResult,
  snapshot: SituationSnapshot
): {
  timestamp: string;
  action: string;
  decision: string;
  riskLevel: string;
  context: string;
  approved: boolean;
} {
  const contextParts = [
    `Activity: ${snapshot.likelyActivity}`,
    `Energy: ${snapshot.energyLevel}`,
    `Location: ${snapshot.environmentType}`,
  ];

  return {
    timestamp: new Date().toISOString(),
    action,
    decision: result.action,
    riskLevel: result.riskLevel,
    context: contextParts.join(' | '),
    approved: result.isSafe || result.action === 'approve',
  };
}
