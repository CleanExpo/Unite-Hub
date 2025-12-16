/**
 * CX09 A/B Testing Circuit
 * Autonomous variant evaluation and winner selection
 * Phase 1: Evaluation-only (no traffic mutation)
 */

/**
 * Variant configuration for A/B test
 */
export interface ABTestVariant {
  variant_id: string;
  channel: 'email' | 'social';
  agent_execution_id: string; // ID of email_agent_executions or social_agent_executions record
  metrics_source: 'email_agent_metrics' | 'social_agent_metrics';
  allocation_percentage: number; // 0-100
}

/**
 * A/B test evaluation input
 */
export interface ABTestEvaluationInput {
  workspace_id: string;
  circuit_execution_id: string;
  test_id: string;
  test_name: string;
  channel: 'email' | 'social' | 'multichannel';
  variants: ABTestVariant[];
  evaluation_window_hours?: number; // Default: 72
  minimum_sample_size?: number; // Default: 100
  confidence_threshold?: number; // Default: 0.95
  primary_metric?: string; // Default: 'engagement_rate'
  secondary_metric?: string;
  tie_breaker_metric?: string;
}

/**
 * Metrics snapshot for a variant
 */
export interface MetricsSnapshot {
  variant_id: string;
  engagement_rate: number;
  click_through_rate?: number;
  time_to_first_engagement?: number; // seconds
  conversion_assist_score?: number;
  sample_size: number;
  collected_at: string; // ISO timestamp
}

/**
 * A/B test evaluation result
 */
export interface ABTestEvaluationResult {
  ab_test_id: string;
  winning_variant_id: string | null;
  runner_up_variant_id?: string;
  confidence_score: number;
  performance_delta: number; // percentage difference
  decision: 'promote' | 'continue_test' | 'terminate';
  recommendation: string;
  variants_evaluated: MetricsSnapshot[];
  evaluated_at: string;
  optimization_signal: OptimizationSignal;
}

/**
 * Optimization signal to emit to CX08_SELF_CORRECTION
 */
export interface OptimizationSignal {
  winning_variant_id: string;
  confidence_score: number;
  performance_delta: number;
  recommendation: string;
  test_id: string;
  timestamp: string;
}

/**
 * Statistical test result
 */
export interface StatisticalTestResult {
  z_score: number;
  p_value: number;
  confidence_interval: [number, number]; // [lower, upper]
  significant_at_threshold: boolean;
}

/**
 * Raw metrics from database
 */
export interface RawVariantMetrics {
  variant_id: string;
  agent_execution_id: string;
  delivered?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  total_sent?: number;
  impressions?: number;
  likes?: number;
  shares?: number;
  total_engagements?: number;
}
