/**
 * Scaling Mode Types
 * Phase 86: Type definitions for Scaling Mode Control & Capacity Engine
 */

export type ScalingMode = 'lab' | 'pilot' | 'growth' | 'scale';

export type ScalingRecommendation = 'hold' | 'increase_mode' | 'decrease_mode' | 'freeze';

export type ScalingEventType = 'mode_change' | 'capacity_update' | 'freeze' | 'unfreeze' | 'note' | 'config_update';

export type ScalingActor = 'founder' | 'system' | 'admin';

export interface ModeLimits {
  max_clients: number;
  max_posts_per_day: number;
  max_ai_spend_daily: number;
}

export interface GuardrailThresholds {
  min_health_for_increase: number;
  max_utilisation_for_increase: number;
  freeze_below_health: number;
  max_warning_density: number;
  max_churn_risk: number;
  max_ai_cost_pressure: number;
  min_confidence_for_change: number;
}

export interface ScalingModeConfig {
  id: string;
  environment: string;
  current_mode: ScalingMode;
  mode_limits: Record<ScalingMode, ModeLimits>;
  auto_mode_enabled: boolean;
  guardrail_thresholds: GuardrailThresholds;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ScalingHealthInputs {
  active_clients: number;
  total_posts_today: number;
  ai_spend_today: number;
  cpu_utilisation: number;
  avg_latency_ms: number;
  error_rate: number;
  active_warnings: number;
  high_severity_warnings: number;
  churn_risk_clients: number;
  data_completeness: Record<string, boolean>;
}

export interface ScalingHealthScores {
  infra_health_score: number;
  ai_cost_pressure_score: number;
  warning_density_score: number;
  churn_risk_score: number;
  overall_scaling_health_score: number;
}

export interface ScalingHealthSnapshot {
  id: string;
  environment: string;
  created_at: string;
  current_mode: ScalingMode;
  active_clients: number;
  safe_capacity: number;
  utilisation_ratio: number;
  infra_health_score: number;
  ai_cost_pressure_score: number;
  warning_density_score: number;
  churn_risk_score: number;
  overall_scaling_health_score: number;
  recommendation: ScalingRecommendation;
  summary_markdown: string;
  confidence_score: number;
  data_completeness: Record<string, boolean>;
  metadata: Record<string, unknown>;
}

export interface ScalingHistoryEvent {
  id: string;
  environment: string;
  created_at: string;
  event_type: ScalingEventType;
  old_mode?: string;
  new_mode?: string;
  reason_markdown: string;
  actor: ScalingActor;
  snapshot_id?: string;
  metadata: Record<string, unknown>;
}

export interface ScalingModeDecision {
  recommendation: ScalingRecommendation;
  confidence: number;
  reasons: string[];
  can_auto_apply: boolean;
  next_mode?: ScalingMode;
}

export interface ScalingModeOverview {
  environment: string;
  current_mode: ScalingMode;
  active_clients: number;
  safe_capacity: number;
  utilisation_percent: number;
  health_score: number;
  recommendation: ScalingRecommendation;
  last_snapshot_at?: string;
  auto_mode_enabled: boolean;
}
