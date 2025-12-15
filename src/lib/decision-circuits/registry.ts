/**
 * Decision Circuit Registry
 * Core governance system for autonomous marketing operations
 * All AI actions flow through registered circuits with traceability
 */

export type CircuitCategory =
  | 'detection'
  | 'classification'
  | 'state_memory'
  | 'decision'
  | 'constraint'
  | 'generation'
  | 'feedback'
  | 'autonomy';

export type CircuitFailureMode =
  | 'fallback_to_last_successful'
  | 'default_to_primary'
  | 'proceed_without_state'
  | 'rotate_to_alternate'
  | 'auto_rewrite_with_penalty'
  | 'regenerate_with_lower_creativity'
  | 'mark_as_neutral'
  | 'escalate_to_admin';

export interface DecisionCircuit {
  circuit_id: string;
  category: CircuitCategory;
  purpose: string;
  inputs: string[];
  outputs: string[];
  failure_mode: CircuitFailureMode;
  success_metric: string;
  model_usage?: 'classification_only' | 'decision_only' | 'generation';
  constraints?: {
    allowed_intents?: string[];
    must_not?: string[];
  };
  rules?: Record<string, string>;
  storage?: string;
}

export interface CircuitExecutionLog {
  circuit_id: string;
  execution_id: string;
  timestamp: number;
  workspace_id: string;
  client_id: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  decision_path: string[];
  success: boolean;
  error?: string;
  latency_ms: number;
  confidence_score?: number;
}

export interface CircuitResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  execution_log: CircuitExecutionLog;
  decision_trace: string[];
}

// Registry of all decision circuits
export const DECISION_CIRCUITS: Record<string, DecisionCircuit> = {
  CX01_INTENT_DETECTION: {
    circuit_id: 'CX01_INTENT_DETECTION',
    category: 'detection',
    purpose: 'Detect marketing intent from business input',
    inputs: ['business_profile', 'campaign_goal', 'historical_context'],
    outputs: ['detected_intent'],
    model_usage: 'classification_only',
    constraints: {
      allowed_intents: [
        'brand_awareness',
        'lead_generation',
        'reputation_building',
        'authority_positioning',
      ],
    },
    failure_mode: 'fallback_to_last_successful',
    success_metric: 'engagement_lift',
  },

  CX02_AUDIENCE_CLASSIFICATION: {
    circuit_id: 'CX02_AUDIENCE_CLASSIFICATION',
    category: 'classification',
    purpose: 'Select target audience segment',
    inputs: ['detected_intent', 'location', 'industry', 'client_history'],
    outputs: ['audience_segment'],
    model_usage: 'classification_only',
    failure_mode: 'default_to_primary',
    success_metric: 'click_through_rate',
  },

  CX03_STATE_MEMORY_RETRIEVAL: {
    circuit_id: 'CX03_STATE_MEMORY_RETRIEVAL',
    category: 'state_memory',
    purpose: 'Retrieve prior successful strategies for this client',
    inputs: ['client_id', 'audience_segment'],
    outputs: ['prior_strategy_signature'],
    storage: 'unite_hub_state_store',
    failure_mode: 'proceed_without_state',
    success_metric: 'strategy_reuse_success',
  },

  CX04_CONTENT_STRATEGY_SELECTION: {
    circuit_id: 'CX04_CONTENT_STRATEGY_SELECTION',
    category: 'decision',
    purpose: 'Choose content strategy based on intent and state',
    inputs: ['detected_intent', 'audience_segment', 'prior_strategy_signature'],
    outputs: ['content_strategy_id'],
    model_usage: 'decision_only',
    failure_mode: 'rotate_to_alternate',
    success_metric: 'engagement_score',
  },

  CX05_BRAND_GUARD: {
    circuit_id: 'CX05_BRAND_GUARD',
    category: 'constraint',
    purpose: 'Ensure brand, tone, and compliance adherence',
    inputs: ['draft_content', 'brand_rules'],
    outputs: ['approved_content', 'violations'],
    constraints: {
      must_not: [
        'misleading_claims',
        'policy_violations',
        'off_brand_language',
      ],
    },
    failure_mode: 'auto_rewrite_with_penalty',
    success_metric: 'zero_violation_rate',
  },

  CX06_GENERATION_EXECUTION: {
    circuit_id: 'CX06_GENERATION_EXECUTION',
    category: 'generation',
    purpose: 'Generate marketing asset',
    inputs: ['content_strategy_id', 'approved_content'],
    outputs: ['final_asset'],
    model_usage: 'generation',
    failure_mode: 'regenerate_with_lower_creativity',
    success_metric: 'post_performance',
  },

  CX07_ENGAGEMENT_EVALUATION: {
    circuit_id: 'CX07_ENGAGEMENT_EVALUATION',
    category: 'feedback',
    purpose: 'Measure performance and feed results back into system',
    inputs: ['final_asset', 'platform_metrics'],
    outputs: ['engagement_score', 'conversion_score'],
    failure_mode: 'mark_as_neutral',
    success_metric: 'positive_delta',
  },

  CX08_SELF_CORRECTION: {
    circuit_id: 'CX08_SELF_CORRECTION',
    category: 'autonomy',
    purpose: 'Adjust strategy without human input',
    inputs: ['engagement_score', 'historical_baseline'],
    outputs: ['updated_strategy_signature'],
    rules: {
      if_engagement_declines_for: '3_cycles',
      then: 'rotate_content_strategy',
    },
    failure_mode: 'escalate_to_admin',
    success_metric: 'recovery_time',
  },
};

/**
 * Get circuit definition by ID
 */
export function getCircuit(circuitId: string): DecisionCircuit | undefined {
  return DECISION_CIRCUITS[circuitId];
}

/**
 * List all circuits by category
 */
export function getCircuitsByCategory(
  category: CircuitCategory
): DecisionCircuit[] {
  return Object.values(DECISION_CIRCUITS).filter(
    (circuit) => circuit.category === category
  );
}

/**
 * Validate circuit inputs
 */
export function validateCircuitInputs(
  circuit: DecisionCircuit,
  inputs: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const missing = circuit.inputs.filter((input) => !(input in inputs));
  return {
    valid: missing.length === 0,
    missing,
  };
}
