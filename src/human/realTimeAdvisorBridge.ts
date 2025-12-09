/**
 * Phase 11 – Real-Time Advisor Bridge
 *
 * Bridges wake-window events to the Phase 9 personal advisor network with real-time processing.
 * - Routes packets to domain-specific advisors
 * - Synthesizes advice with current life signals + cognitive state
 * - Generates immediate action recommendations
 * - Integrates with Parallel Phill autonomy policies
 * - Returns advisor response in <2 second latency
 *
 * Integration: Receives RoutingDecision from microReasoningRouter
 * Calls: personalAdvisor, Phase 9 business brain
 * Output: AdvisorResponse with advice + action items + follow-up timing
 * Cost target: <$0.01 per advisor call (via context caching)
 */

import type { CompressedContextPacket } from './contextCompressionEngine';
import type { RoutingDecision } from './microReasoningRouter';
import type { CognitiveState } from './cognitiveStateEngine';
import type { LifeSignal } from './lifeSignalIngestor';

// ============================================================================
// ADVISOR RESPONSE TYPES
// ============================================================================

export type AdvisorType =
  | 'business_advisor'
  | 'product_advisor'
  | 'financial_advisor'
  | 'ops_advisor'
  | 'marketing_advisor'
  | 'people_advisor'
  | 'personal_advisor'
  | 'strategic_advisor';

export type AdviceType = 'immediate_action' | 'decision_guidance' | 'strategic_analysis' | 'tactical_recommendation' | 'risk_alert' | 'opportunity_identification';

export interface AdvisorResponse {
  // Response Identity
  response_id: string;
  timestamp: string;
  packet_id: string;
  advisor_type: AdvisorType;

  // Advice Content
  advice_type: AdviceType;
  primary_recommendation: string; // <200 chars
  supporting_reasoning: string; // <500 chars
  confidence: number; // 0-1

  // Action Items
  immediate_actions?: string[]; // 0-3 items for instant execution
  follow_up_actions?: string[]; // 1-2 items for later (with timing)

  // Context Integration
  considers_cognitive_state: boolean;
  considers_life_signals: boolean;
  considers_business_metrics: boolean;
  considers_autonomy_policy: boolean;

  // Timing Recommendations
  suggested_execution_time: 'immediate' | 'next_hour' | 'today' | 'this_week' | 'deferred';
  best_time_to_act?: string; // If deferred, suggested timing
  reason_for_timing: string; // Why this timing

  // Quality & Risk
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_founder_approval: boolean;
  founder_approval_reason?: string;

  // Fallback & Escalation
  advisor_confidence: number; // How confident advisor is in recommendation
  can_execute_autonomously: boolean;
  escalation_criteria?: string; // If conditions met, escalate to founder

  // Cost & Performance
  processing_time_ms: number;
  model_used?: string;
  tokens_used?: number;
}

export interface AdvisorContext {
  // Current State
  cognitive_state?: CognitiveState;
  life_signals?: LifeSignal[];
  current_goals?: string[];
  recent_decisions?: string[];

  // Business Context
  business_health_score?: number; // 0-100
  critical_metrics?: Record<string, number>;
  at_risk_areas?: string[];

  // Historical Context
  advisor_history?: {
    recent_advice: string[];
    advice_outcomes: { advice: string; outcome: 'positive' | 'neutral' | 'negative' }[];
    advisor_accuracy: number; // 0-1
  };
}

// ============================================================================
// ADVISOR DOMAIN CONFIGURATION
// ============================================================================

const ADVISOR_PROFILES: Record<AdvisorType, { domain: string; expertise: string[]; risk_threshold: number }> = {
  business_advisor: {
    domain: 'business',
    expertise: ['revenue models', 'market positioning', 'customer acquisition', 'partnerships'],
    risk_threshold: 7,
  },
  product_advisor: {
    domain: 'product',
    expertise: ['feature prioritization', 'user research', 'roadmap planning', 'MVP definition'],
    risk_threshold: 6,
  },
  financial_advisor: {
    domain: 'finance',
    expertise: ['burn rate optimization', 'unit economics', 'fundraising', 'expense management'],
    risk_threshold: 8,
  },
  ops_advisor: {
    domain: 'operations',
    expertise: ['process optimization', 'tool selection', 'automation', 'workflow design'],
    risk_threshold: 5,
  },
  marketing_advisor: {
    domain: 'marketing',
    expertise: ['content strategy', 'channel selection', 'campaign optimization', 'brand positioning'],
    risk_threshold: 5,
  },
  people_advisor: {
    domain: 'people',
    expertise: ['hiring', 'team development', 'culture', 'retention strategies'],
    risk_threshold: 9, // Very conservative
  },
  personal_advisor: {
    domain: 'personal',
    expertise: ['wellbeing', 'learning', 'habit formation', 'work-life balance'],
    risk_threshold: 4,
  },
  strategic_advisor: {
    domain: 'strategic',
    expertise: ['market analysis', 'competitive positioning', 'long-term planning', 'innovation strategy'],
    risk_threshold: 8,
  },
};

// ============================================================================
// ADVISOR SELECTION
// ============================================================================

/**
 * Select primary advisor based on domain
 */
export function selectAdvisor(domain: string): AdvisorType {
  const advisorMap: Record<string, AdvisorType> = {
    business: 'business_advisor',
    product: 'product_advisor',
    finance: 'financial_advisor',
    operations: 'ops_advisor',
    marketing: 'marketing_advisor',
    people: 'people_advisor',
    personal_development: 'personal_advisor',
    strategic: 'strategic_advisor',
  };

  return advisorMap[domain] || 'business_advisor';
}

// ============================================================================
// COGNITIVE STATE INTEGRATION
// ============================================================================

/**
 * Adjust advice based on Phill's cognitive state
 */
export function adjustAdviceForCognitiveState(
  baseAdvice: string,
  cognitiveState: CognitiveState | undefined
): {
  adjusted_advice: string;
  timing_recommendation: 'immediate' | 'defer_to_better_state';
  modifications_applied: string[];
} {
  const modifications: string[] = [];

  if (!cognitiveState) {
    return {
      adjusted_advice: baseAdvice,
      timing_recommendation: 'immediate',
      modifications_applied: [],
    };
  }

  switch (cognitiveState) {
    case 'sharp':
      // Can handle complex advice
      return {
        adjusted_advice: baseAdvice,
        timing_recommendation: 'immediate',
        modifications_applied: ['Suitable for immediate action'],
      };

    case 'good':
      // Can handle most advice
      return {
        adjusted_advice: baseAdvice,
        timing_recommendation: 'immediate',
        modifications_applied: ['Normal cognitive capacity'],
      };

    case 'tired':
      // Simplify and defer complex advice
      modifications.push('Simplified due to fatigue');
      return {
        adjusted_advice: `${baseAdvice} (Note: Consider revisiting when better rested)`,
        timing_recommendation: 'defer_to_better_state',
        modifications_applied: modifications,
      };

    case 'fatigued':
      // Strongly defer complex advice
      modifications.push('Deferred due to fatigue');
      return {
        adjusted_advice: `${baseAdvice} DEFERRAL RECOMMENDED: Review when recovered.`,
        timing_recommendation: 'defer_to_better_state',
        modifications_applied: modifications,
      };

    case 'overloaded':
      // Only critical advice, all else deferred
      modifications.push('Only critical items recommended');
      return {
        adjusted_advice: `${baseAdvice} URGENT DEFERRAL: Prioritize rest. Handle only if critical.`,
        timing_recommendation: 'defer_to_better_state',
        modifications_applied: modifications,
      };
  }
}

// ============================================================================
// AUTONOMY POLICY INTEGRATION
// ============================================================================

/**
 * Check if advisor response can be executed autonomously
 */
export function canExecuteAutonomously(
  advisor: AdvisorType,
  actionType: string,
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
): {
  can_execute: boolean;
  requires_approval: boolean;
  reason: string;
} {
  // People advisor: all decisions require approval
  if (advisor === 'people_advisor') {
    return {
      can_execute: false,
      requires_approval: true,
      reason: 'People decisions require founder approval (Phase 10 autonomy policy)',
    };
  }

  // Financial advisor: high and critical risk require approval
  if (advisor === 'financial_advisor' && (riskLevel === 'high' || riskLevel === 'critical')) {
    return {
      can_execute: false,
      requires_approval: true,
      reason: 'High-risk financial decisions require founder approval',
    };
  }

  // Strategic advisor: critical decisions require approval
  if (advisor === 'strategic_advisor' && riskLevel === 'critical') {
    return {
      can_execute: false,
      requires_approval: true,
      reason: 'Critical strategic decisions require founder approval',
    };
  }

  // All other cases: can execute, but log
  return {
    can_execute: true,
    requires_approval: false,
    reason: 'Autonomous execution allowed by autonomy policy',
  };
}

// ============================================================================
// IMMEDIATE ACTION GENERATION
// ============================================================================

/**
 * Generate concrete immediate actions from advice
 */
export function generateImmediateActions(
  baseRecommendation: string,
  actionType: AdviceType,
  domain: string
): string[] {
  const actions: string[] = [];

  // Task-oriented actions
  if (baseRecommendation.includes('email') || baseRecommendation.includes('send')) {
    actions.push('Draft and review email with Parallel Phill');
  }

  if (baseRecommendation.includes('schedule') || baseRecommendation.includes('meeting')) {
    actions.push('Check calendar and schedule meeting');
  }

  if (baseRecommendation.includes('analyze') || baseRecommendation.includes('review')) {
    actions.push('Pull data and begin analysis');
  }

  // Domain-specific immediate actions
  if (domain === 'finance') {
    if (baseRecommendation.includes('cost') || baseRecommendation.includes('spend')) {
      actions.push('Review expense breakdown for optimization opportunities');
    }
  }

  if (domain === 'product') {
    if (baseRecommendation.includes('feature') || baseRecommendation.includes('roadmap')) {
      actions.push('Update product roadmap and communicate to team');
    }
  }

  if (domain === 'people') {
    if (baseRecommendation.includes('feedback') || baseRecommendation.includes('conversation')) {
      actions.push('Schedule 1:1 conversation with team member');
    }
  }

  // Limit to top 3 immediate actions
  return actions.slice(0, 3);
}

// ============================================================================
// TIMING RECOMMENDATION
// ============================================================================

/**
 * Recommend optimal timing for executing advice
 */
export function recommendExecutionTiming(
  cognitiveState: CognitiveState | undefined,
  actionType: AdviceType,
  priority: 'low' | 'medium' | 'high' | 'critical'
): {
  suggested_execution_time: 'immediate' | 'next_hour' | 'today' | 'this_week' | 'deferred';
  best_time_to_act?: string;
  reason: string;
} {
  // Critical always immediate
  if (priority === 'critical') {
    return {
      suggested_execution_time: 'immediate',
      reason: 'Critical priority requires immediate execution',
    };
  }

  // Defer if overloaded or fatigued
  if (cognitiveState === 'overloaded' || cognitiveState === 'fatigued') {
    return {
      suggested_execution_time: 'deferred',
      best_time_to_act: 'After rest and recovery',
      reason: 'Current cognitive state unsuitable for complex decisions',
    };
  }

  // Decision-oriented actions: do when sharp
  if (actionType === 'decision_guidance') {
    if (cognitiveState === 'sharp') {
      return {
        suggested_execution_time: 'immediate',
        best_time_to_act: 'Now (peak cognitive state)',
        reason: 'Optimal time for decision-making',
      };
    }

    if (cognitiveState === 'good') {
      return {
        suggested_execution_time: 'today',
        best_time_to_act: 'Morning (next peak window)',
        reason: 'Defer to morning peak focus window',
      };
    }

    return {
      suggested_execution_time: 'this_week',
      best_time_to_act: 'During peak productivity window',
      reason: 'Complex decision best made at peak cognitive capacity',
    };
  }

  // Immediate actions: do soon
  if (actionType === 'immediate_action') {
    return {
      suggested_execution_time: 'next_hour',
      reason: 'Immediate actions have time-sensitive value',
    };
  }

  // Strategic analysis: batch into deep work session
  if (actionType === 'strategic_analysis') {
    return {
      suggested_execution_time: 'today',
      best_time_to_act: 'Deep work session (2-4pm)',
      reason: 'Strategic analysis requires focused time block',
    };
  }

  // Default: do today
  return {
    suggested_execution_time: 'today',
    reason: 'Action suitable for today',
  };
}

// ============================================================================
// ADVISOR RESPONSE GENERATION
// ============================================================================

/**
 * Generate advisor response for a compressed packet
 */
export async function generateAdvisorResponse(
  packet: CompressedContextPacket,
  routing: RoutingDecision,
  context: AdvisorContext
): Promise<AdvisorResponse> {
  const startTime = Date.now();

  // Select advisor
  const advisor = selectAdvisor(packet.domain);
  const advisorProfile = ADVISOR_PROFILES[advisor];

  // Simulate advisor reasoning (in production: call Claude API)
  // For MVP: generate response based on domain + intent
  const primaryRecommendation = generatePrimaryRecommendation(packet, advisor);

  // Adjust for cognitive state
  const cognitiveAdjustment = adjustAdviceForCognitiveState(primaryRecommendation, context.cognitive_state);

  // Check autonomy
  const autonomyCheck = canExecuteAutonomously(advisor, packet.implicit_action || 'general', packet.priority);

  // Generate immediate actions
  const immediateActions = generateImmediateActions(primaryRecommendation, 'immediate_action', packet.domain);

  // Recommend timing
  const timingRec = recommendExecutionTiming(context.cognitive_state, 'immediate_action', packet.priority);

  // Determine risk level
  const riskLevel = determineRiskLevel(packet, advisor, context);

  // Generate supporting reasoning
  const supportingReasoning = generateSupportingReasoning(packet, advisor, context);

  return {
    response_id: `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    packet_id: packet.packet_id,
    advisor_type: advisor,
    advice_type: 'immediate_action',
    primary_recommendation: cognitiveAdjustment.adjusted_advice,
    supporting_reasoning: supportingReasoning,
    confidence: packet.confidence * 0.95, // Slightly reduced for advisor confidence
    immediate_actions: immediateActions,
    follow_up_actions: generateFollowUpActions(packet, advisor),
    considers_cognitive_state: !!context.cognitive_state,
    considers_life_signals: !!context.life_signals,
    considers_business_metrics: !!context.business_health_score,
    considers_autonomy_policy: true,
    suggested_execution_time: timingRec.suggested_execution_time,
    best_time_to_act: timingRec.best_time_to_act,
    reason_for_timing: timingRec.reason,
    risk_level: riskLevel,
    requires_founder_approval: !autonomyCheck.can_execute || routing.founder_approval_required || false,
    founder_approval_reason: !autonomyCheck.can_execute ? autonomyCheck.reason : undefined,
    advisor_confidence: Math.max(0.6, packet.confidence - 0.1),
    can_execute_autonomously: autonomyCheck.can_execute,
    escalation_criteria: riskLevel === 'critical' ? 'Critical risk decisions always escalate' : undefined,
    processing_time_ms: Date.now() - startTime,
    tokens_used: Math.ceil((packet.summary.length + supportingReasoning.length) / 4),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate primary recommendation based on domain and intent
 */
function generatePrimaryRecommendation(packet: CompressedContextPacket, advisor: AdvisorType): string {
  const action = packet.implicit_action || 'address';
  const domain = packet.domain;

  // Domain-specific templates
  const templates: Record<string, string> = {
    business_advisor: `Focus on ${action}. Current opportunity aligns with growth strategy.`,
    product_advisor: `Recommend ${action} as part of roadmap optimization.`,
    financial_advisor: `${action} will improve unit economics. Analyze impact first.`,
    ops_advisor: `${action} will improve operational efficiency. Automate if possible.`,
    marketing_advisor: `${action} aligns with brand positioning and audience preferences.`,
    people_advisor: `${action} supports team development and engagement.`,
    personal_advisor: `${action} supports wellbeing and sustainable performance.`,
    strategic_advisor: `${action} positions us for long-term competitive advantage.`,
  };

  return templates[advisor] || `${action} is recommended.`;
}

/**
 * Generate supporting reasoning
 */
function generateSupportingReasoning(packet: CompressedContextPacket, advisor: AdvisorType, context: AdvisorContext): string {
  const parts: string[] = [];

  // Context integration
  if (context.cognitive_state) {
    parts.push(`Current cognitive state (${context.cognitive_state}) is conducive to this action.`);
  }

  if (context.business_health_score !== undefined) {
    parts.push(`Business health score: ${context.business_health_score}/100. Action supports key priorities.`);
  }

  if (context.at_risk_areas && context.at_risk_areas.length > 0) {
    parts.push(`Addresses at-risk areas: ${context.at_risk_areas.join(', ')}.`);
  }

  // Advisor-specific reasoning
  const advisorReasons: Record<AdvisorType, string> = {
    business_advisor: 'Supports revenue and market positioning goals.',
    product_advisor: 'Enhances user value and product differentiation.',
    financial_advisor: 'Improves unit economics and burn rate trajectory.',
    ops_advisor: 'Increases efficiency and reduces operational friction.',
    marketing_advisor: 'Strengthens brand presence and audience engagement.',
    people_advisor: 'Fosters team cohesion and individual growth.',
    personal_advisor: 'Supports sustainable performance and wellbeing.',
    strategic_advisor: 'Positions for competitive advantage in market.',
  };

  parts.push(advisorReasons[advisor]);

  return parts.join(' ');
}

/**
 * Generate follow-up actions
 */
function generateFollowUpActions(packet: CompressedContextPacket, advisor: AdvisorType): string[] {
  const actions: string[] = [];

  // Add domain-specific follow-ups
  if (packet.domain === 'finance') {
    actions.push('Track impact on burn rate and runway');
  }

  if (packet.domain === 'product') {
    actions.push('Gather user feedback on changes');
  }

  if (packet.domain === 'people') {
    actions.push('Follow up with team on progress');
  }

  // Generic follow-up
  actions.push('Document decision and rationale for future reference');

  return actions.slice(0, 2); // Limit to 2 follow-ups
}

/**
 * Determine overall risk level
 */
function determineRiskLevel(
  packet: CompressedContextPacket,
  advisor: AdvisorType,
  context: AdvisorContext
): 'low' | 'medium' | 'high' | 'critical' {
  if (packet.priority === 'critical') {
return 'critical';
}

  const advisorProfile = ADVISOR_PROFILES[advisor];

  // Financial decisions are inherently higher risk
  if (advisor === 'financial_advisor' && packet.priority === 'high') {
    return 'high';
  }

  // People decisions are high risk
  if (advisor === 'people_advisor') {
    return 'high';
  }

  // Strategic decisions at high priority are high risk
  if (advisor === 'strategic_advisor' && packet.priority === 'high') {
    return 'high';
  }

  // Most decisions are medium or low
  if (packet.priority === 'high') {
return 'medium';
}

  return 'low';
}
