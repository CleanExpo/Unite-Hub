/**
 * Phase 11 – Micro Reasoning Router
 *
 * Routes compressed context packets to appropriate reasoning engines:
 * - Local on-device reasoning (lightweight intents, simple tasks)
 * - Cloud model reasoning (complex analysis, strategic decisions)
 * - Advisor network (domain-specific expertise + founder context)
 *
 * Integration: Receives CompressedContextPacket from contextCompressionEngine
 * Output: RoutingDecision specifying execution path and estimated cost
 * Cost target: <$0.005 per routing decision (token minimization via early filtering)
 */

import type { CompressedContextPacket } from './contextCompressionEngine';

// ============================================================================
// ROUTING TYPES
// ============================================================================

export type ReasoningEngine = 'local_intent' | 'local_task' | 'cloud_standard' | 'cloud_extended' | 'advisor_network' | 'blocked';

export type CloudModel = 'claude-haiku-4-5' | 'claude-sonnet-4-5' | 'claude-opus-4-1';

export interface RoutingDecision {
  // Decision Metadata
  packet_id: string;
  timestamp: string;
  routing_decision_id: string;

  // Routing Target
  primary_engine: ReasoningEngine;
  fallback_engines: ReasoningEngine[];
  selected_model?: CloudModel; // If routing to cloud

  // Execution Parameters
  budget_tokens?: number; // Max tokens for cloud inference
  use_extended_thinking?: boolean; // For opus only, complex tasks
  cache_context?: boolean; // Can use prompt caching

  // Cost Estimate
  estimated_cost: number; // USD, total for this reasoning
  estimated_latency_ms: number;
  execution_priority: 'immediate' | 'high' | 'normal' | 'batch';

  // Reasoning Context
  requires_historical_context?: boolean; // Needs past interactions/goals
  requires_life_signals?: boolean; // Needs cognitive state, sleep, etc.
  requires_business_brain?: boolean; // Needs business metrics

  // Governance
  phase8_review?: boolean; // Needs Phase 8 governor review
  founder_approval_required?: boolean; // Needs explicit founder decision

  // Quality Metrics
  confidence: number; // 0-1, routing decision confidence
  reasoning: string; // Explanation for routing choice
}

// ============================================================================
// LOCAL REASONING RULES
// ============================================================================

/**
 * Determine if packet can be handled by local on-device reasoning
 */
export function canHandleLocalIntentDetection(packet: CompressedContextPacket): boolean {
  // Simple, low-confidence extraction tasks
  if (packet.complexity_level !== 'simple') {
return false;
}

  // Intent detection only (not full reasoning)
  if (!['task', 'reminder', 'status_check'].includes(packet.event_tag)) {
return false;
}

  // High confidence in compression
  if (packet.confidence < 0.85) {
return false;
}

  // No contextual knowledge needed
  if (packet.requires_context) {
return false;
}

  return true;
}

/**
 * Determine if packet can be handled by local task execution
 */
export function canHandleLocalTaskExecution(packet: CompressedContextPacket): boolean {
  // Must be a clear task
  if (packet.event_tag !== 'task') {
return false;
}

  // Simple complexity level
  if (packet.complexity_level !== 'simple') {
return false;
}

  // Actions that don't require reasoning: scheduling, tagging, reminding
  const simpleTaskActions = ['Add to calendar', 'Set reminder', 'Tag contact'];
  if (!packet.implicit_action || !simpleTaskActions.some((action) => packet.implicit_action?.includes(action))) {
    return false;
  }

  // Not requiring business context
  if (packet.requires_context) {
return false;
}

  return true;
}

// ============================================================================
// CLOUD MODEL SELECTION
// ============================================================================

/**
 * Select cloud model based on complexity and cost
 */
export function selectCloudModel(
  complexity: 'simple' | 'moderate' | 'complex',
  domain: string,
  budget_available?: number
): {
  model: CloudModel;
  max_tokens: number;
  use_extended_thinking: boolean;
} {
  // Haiku: Simple, fast, cheap ($0.80/$2.40 per MTok)
  if (complexity === 'simple') {
    return {
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      use_extended_thinking: false,
    };
  }

  // Sonnet: Standard reasoning, good balance ($3/$15 per MTok)
  if (complexity === 'moderate') {
    return {
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      use_extended_thinking: false,
    };
  }

  // Opus: Complex reasoning with extended thinking ($15/$45 per MTok + 7.5x for thinking)
  // Strategic, financial, product decisions
  if (complexity === 'complex') {
    const strategicDomains = ['strategic', 'finance', 'product'];
    const useExtendedThinking = strategicDomains.includes(domain);

    return {
      model: 'claude-opus-4-1',
      max_tokens: useExtendedThinking ? 16000 : 4096, // Larger context for thinking
      use_extended_thinking: useExtendedThinking,
    };
  }

  // Fallback
  return {
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    use_extended_thinking: false,
  };
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

const MODEL_INPUT_COSTS: Record<CloudModel, number> = {
  'claude-haiku-4-5': 0.80 / 1_000_000, // $0.80 per MTok
  'claude-sonnet-4-5': 3 / 1_000_000, // $3 per MTok
  'claude-opus-4-1': 15 / 1_000_000, // $15 per MTok
};

const MODEL_OUTPUT_COSTS: Record<CloudModel, number> = {
  'claude-haiku-4-5': 2.4 / 1_000_000, // $2.40 per MTok
  'claude-sonnet-4-5': 15 / 1_000_000, // $15 per MTok
  'claude-opus-4-1': 45 / 1_000_000, // $45 per MTok
};

const THINKING_TOKEN_COST_MULTIPLIER = 7.5; // Thinking tokens cost 7.5x more

/**
 * Estimate cost for cloud reasoning
 */
export function estimateCloudCost(
  model: CloudModel,
  inputTokens: number,
  expectedOutputTokens: number,
  useExtendedThinking: boolean = false
): number {
  let inputCost = inputTokens * MODEL_INPUT_COSTS[model];
  const outputCost = expectedOutputTokens * MODEL_OUTPUT_COSTS[model];

  // Extended thinking multiplier
  if (useExtendedThinking) {
    // Assume 60% of input becomes thinking tokens
    const thinkingTokens = Math.floor(inputTokens * 0.6);
    const regularInputTokens = inputTokens - thinkingTokens;

    inputCost = regularInputTokens * MODEL_INPUT_COSTS[model] + thinkingTokens * MODEL_INPUT_COSTS[model] * THINKING_TOKEN_COST_MULTIPLIER;
  }

  return inputCost + outputCost;
}

// ============================================================================
// LATENCY ESTIMATION
// ============================================================================

const LATENCY_PROFILES = {
  local_intent: { min: 50, max: 200 }, // ms, on-device ML
  local_task: { min: 30, max: 150 }, // ms, simple logic
  cloud_standard: { min: 500, max: 2000 }, // ms, network + inference
  cloud_extended: { min: 2000, max: 10000 }, // ms, network + extended thinking
  advisor_network: { min: 1000, max: 5000 }, // ms, routing + advisor response
  blocked: { min: 100, max: 500 }, // ms, policy enforcement
};

/**
 * Estimate latency for reasoning engine
 */
export function estimateLatency(engine: ReasoningEngine): number {
  const profile = LATENCY_PROFILES[engine];
  if (!profile) {
return 1000;
}

  // Average of min and max
  return (profile.min + profile.max) / 2;
}

// ============================================================================
// GOVERNANCE & BLOCKING RULES
// ============================================================================

/**
 * Check if packet is blocked by governance policies
 */
export function checkGovernanceRules(packet: CompressedContextPacket): {
  allowed: boolean;
  reason?: string;
  requires_phase8_review?: boolean;
} {
  // Financial actions blocked
  if (packet.domain === 'finance' && packet.event_tag === 'task' && packet.implicit_action?.includes('Execute')) {
    return {
      allowed: false,
      reason: 'Financial transactions require explicit founder approval',
      requires_phase8_review: true,
    };
  }

  // Health advice blocked
  if (packet.domain === 'personal_development' && packet.implicit_action?.toLowerCase().includes('diagnose')) {
    return {
      allowed: false,
      reason: 'Medical advice prohibited by Phase 8 governance',
    };
  }

  // People/hiring decisions require founder approval
  if (packet.domain === 'people' && ['hiring', 'compensation', 'termination'].some((word) => packet.implicit_action?.toLowerCase().includes(word) || false)) {
    return {
      allowed: true,
      requires_phase8_review: true,
      reason: 'People decisions require Phase 8 review and founder approval',
    };
  }

  // High-risk strategic decisions
  if (packet.domain === 'strategic' && packet.priority === 'critical') {
    return {
      allowed: true,
      requires_phase8_review: true,
      reason: 'Critical strategic decision requires governance review',
    };
  }

  return {
    allowed: true,
  };
}

// ============================================================================
// MAIN ROUTING FUNCTION
// ============================================================================

/**
 * Route a compressed packet to appropriate reasoning engine
 */
export function routeCompressedPacket(packet: CompressedContextPacket): RoutingDecision {
  const startTime = Date.now();

  // Check governance first
  const governanceCheck = checkGovernanceRules(packet);
  if (!governanceCheck.allowed) {
    return {
      packet_id: packet.packet_id,
      timestamp: new Date().toISOString(),
      routing_decision_id: `rd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      primary_engine: 'blocked',
      fallback_engines: [],
      estimated_cost: 0,
      estimated_latency_ms: estimateLatency('blocked'),
      execution_priority: 'immediate',
      phase8_review: true,
      founder_approval_required: true,
      confidence: 1.0,
      reasoning: governanceCheck.reason || 'Governance policy violation',
    };
  }

  // Try local intent detection
  if (canHandleLocalIntentDetection(packet)) {
    return {
      packet_id: packet.packet_id,
      timestamp: new Date().toISOString(),
      routing_decision_id: `rd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      primary_engine: 'local_intent',
      fallback_engines: ['cloud_standard'],
      estimated_cost: 0, // No API call
      estimated_latency_ms: estimateLatency('local_intent'),
      execution_priority: 'immediate',
      requires_life_signals: false,
      requires_business_brain: packet.domain === 'business',
      confidence: packet.confidence,
      reasoning: 'Simple intent extraction handled locally on-device',
    };
  }

  // Try local task execution
  if (canHandleLocalTaskExecution(packet)) {
    return {
      packet_id: packet.packet_id,
      timestamp: new Date().toISOString(),
      routing_decision_id: `rd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      primary_engine: 'local_task',
      fallback_engines: ['cloud_standard'],
      estimated_cost: 0,
      estimated_latency_ms: estimateLatency('local_task'),
      execution_priority: 'immediate',
      requires_life_signals: false,
      requires_business_brain: packet.domain === 'business',
      confidence: packet.confidence,
      reasoning: 'Simple task execution handled locally on-device',
    };
  }

  // Route to advisor network for domain-specific expertise
  if (packet.event_tag === 'advisor_query' || packet.requires_context) {
    return {
      packet_id: packet.packet_id,
      timestamp: new Date().toISOString(),
      routing_decision_id: `rd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      primary_engine: 'advisor_network',
      fallback_engines: ['cloud_standard'],
      estimated_cost: 0.005, // Minimal advisor routing cost
      estimated_latency_ms: estimateLatency('advisor_network'),
      execution_priority: packet.priority === 'critical' ? 'high' : 'normal',
      requires_historical_context: true,
      requires_life_signals: true,
      requires_business_brain: ['business', 'strategic', 'finance'].includes(packet.domain),
      phase8_review: governanceCheck.requires_phase8_review,
      founder_approval_required: packet.event_tag === 'decision_needed' && packet.priority === 'high',
      confidence: packet.confidence,
      reasoning: `Domain-specific routing to ${packet.advisor_routing}`,
    };
  }

  // Select cloud model for complex reasoning
  const modelSelection = selectCloudModel(packet.complexity_level, packet.domain);
  const estimatedInputTokens = Math.ceil((packet.summary.length + 200) / 4); // Summary + context
  const estimatedOutputTokens = modelSelection.max_tokens * 0.3; // Assume 30% usage
  const estimatedCost = estimateCloudCost(
    modelSelection.model,
    estimatedInputTokens,
    estimatedOutputTokens,
    modelSelection.use_extended_thinking
  );

  const engine: ReasoningEngine = modelSelection.use_extended_thinking ? 'cloud_extended' : 'cloud_standard';

  return {
    packet_id: packet.packet_id,
    timestamp: new Date().toISOString(),
    routing_decision_id: `rd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    primary_engine: engine,
    fallback_engines: engine === 'cloud_extended' ? ['cloud_standard', 'advisor_network'] : ['cloud_standard'],
    selected_model: modelSelection.model,
    budget_tokens: modelSelection.max_tokens,
    use_extended_thinking: modelSelection.use_extended_thinking,
    cache_context: packet.requires_context, // Enable prompt caching if contextual
    estimated_cost: estimatedCost,
    estimated_latency_ms: estimateLatency(engine),
    execution_priority: packet.priority === 'critical' ? 'high' : packet.multi_step ? 'normal' : 'batch',
    requires_historical_context: packet.requires_context,
    requires_life_signals: packet.energy_cost !== 'low',
    requires_business_brain: ['business', 'strategic', 'finance', 'operations'].includes(packet.domain),
    phase8_review: governanceCheck.requires_phase8_review,
    founder_approval_required: packet.priority === 'critical' && ['strategic', 'finance'].includes(packet.domain),
    confidence: packet.confidence * 0.95, // Slightly reduced confidence due to model selection uncertainty
    reasoning: `Route to ${modelSelection.model}${modelSelection.use_extended_thinking ? ' with Extended Thinking' : ''} for ${packet.complexity_level} ${packet.domain} reasoning`,
  };
}

// ============================================================================
// BATCH ROUTING
// ============================================================================

/**
 * Route multiple packets and optimize for batching
 */
export function routeBatch(packets: CompressedContextPacket[]): {
  routing_decisions: RoutingDecision[];
  batch_optimization: {
    local_only: number;
    cloud_only: number;
    mixed: number;
    total_estimated_cost: number;
    can_batch: boolean;
    recommended_batch_size: number;
  };
} {
  const routing_decisions = packets.map((packet) => routeCompressedPacket(packet));

  // Categorize by engine
  const localCount = routing_decisions.filter((d) => d.primary_engine.startsWith('local')).length;
  const cloudCount = routing_decisions.filter((d) => d.primary_engine.startsWith('cloud')).length;
  const advisorCount = routing_decisions.filter((d) => d.primary_engine === 'advisor_network').length;
  const blockedCount = routing_decisions.filter((d) => d.primary_engine === 'blocked').length;

  const totalCost = routing_decisions.reduce((sum, d) => sum + d.estimated_cost, 0);

  // Determine if can batch cloud calls
  const cloudDecisions = routing_decisions.filter((d) => d.primary_engine.startsWith('cloud'));
  const canBatch = cloudDecisions.length >= 2 && totalCost < 0.05; // Can batch if <$0.05 total
  const recommendedBatchSize = Math.min(5, cloudDecisions.length); // Max 5 per batch

  return {
    routing_decisions,
    batch_optimization: {
      local_only: localCount,
      cloud_only: cloudCount,
      mixed: advisorCount + blockedCount,
      total_estimated_cost: totalCost,
      can_batch: canBatch,
      recommended_batch_size: recommendedBatchSize,
    },
  };
}

// ============================================================================
// COST ANALYSIS & OPTIMIZATION
// ============================================================================

/**
 * Analyze cost of routing decisions
 */
export function analyzeCosts(decisions: RoutingDecision[]): {
  total_cost: number;
  avg_cost_per_decision: number;
  by_engine: Record<string, number>;
  by_model: Record<string, number>;
  cost_breakdown: string;
} {
  const byEngine: Record<string, number> = {};
  const byModel: Record<string, number> = {};

  for (const decision of decisions) {
    byEngine[decision.primary_engine] = (byEngine[decision.primary_engine] || 0) + decision.estimated_cost;
    if (decision.selected_model) {
      byModel[decision.selected_model] = (byModel[decision.selected_model] || 0) + decision.estimated_cost;
    }
  }

  const totalCost = decisions.reduce((sum, d) => sum + d.estimated_cost, 0);
  const avgCost = decisions.length > 0 ? totalCost / decisions.length : 0;

  const breakdown = [
    `Total: $${totalCost.toFixed(4)}`,
    `Avg per decision: $${avgCost.toFixed(6)}`,
    `Local (free): ${decisions.filter((d) => d.primary_engine.startsWith('local')).length} decisions`,
    `Cloud: ${decisions.filter((d) => d.primary_engine.startsWith('cloud')).length} decisions`,
  ].join(' | ');

  return {
    total_cost: totalCost,
    avg_cost_per_decision: avgCost,
    by_engine: byEngine,
    by_model: byModel,
    cost_breakdown: breakdown,
  };
}
