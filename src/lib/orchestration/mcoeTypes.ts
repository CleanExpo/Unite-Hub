/**
 * MCOE Types
 * Phase 84: Type definitions for Multi-Agent Campaign Orchestration Engine
 */

// ============================================================================
// Channel & Status Types
// ============================================================================

export type Channel = 'fb' | 'ig' | 'tiktok' | 'linkedin' | 'youtube' | 'gmb' | 'reddit' | 'email' | 'x';

export type ScheduleStatus = 'pending' | 'ready' | 'executing' | 'completed' | 'failed' | 'blocked' | 'cancelled';

export type ActionType =
  | 'select_asset'
  | 'time_choice'
  | 'variation_choice'
  | 'evolution_step'
  | 'posting_decision'
  | 'schedule_created'
  | 'schedule_blocked'
  | 'schedule_approved'
  | 'schedule_executed'
  | 'schedule_failed'
  | 'conflict_detected'
  | 'fatigue_check';

export type RiskClass = 'low' | 'medium' | 'high';

export type ActionStatus = 'accepted' | 'rejected' | 'auto_executed' | 'awaiting_approval' | 'pending';

// ============================================================================
// Schedule Types
// ============================================================================

export interface OrchestrationSchedule {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  workspace_id: string;
  campaign_id?: string;
  channel: Channel;
  scheduled_for: string;
  time_zone: string;
  creative_asset_id?: string;
  variation_id?: string;
  content_preview: ContentPreview;
  status: ScheduleStatus;
  priority: number;
  metadata: Record<string, unknown>;
  risk_level: RiskClass;
  blocked_reason?: string;
  executed_at?: string;
  execution_result?: ExecutionResult;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface ContentPreview {
  title?: string;
  body?: string;
  media_urls?: string[];
  hashtags?: string[];
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  platform_response?: Record<string, unknown>;
  post_id?: string;
}

export interface ScheduleInput {
  client_id: string;
  workspace_id: string;
  campaign_id?: string;
  channel: Channel;
  scheduled_for: string;
  creative_asset_id?: string;
  content_preview?: ContentPreview;
  priority?: number;
}

// ============================================================================
// Action Types
// ============================================================================

export interface OrchestrationAction {
  id: string;
  created_at: string;
  schedule_id?: string;
  client_id: string;
  workspace_id: string;
  action_type: ActionType;
  decision_payload: Record<string, unknown>;
  source_signals: SourceSignals;
  risk_class: RiskClass;
  confidence_score: number;
  truth_notes?: string;
  truth_compliant: boolean;
  disclaimers: string[];
  status: ActionStatus;
  executed_at?: string;
  execution_result?: ExecutionResult;
  actor: string;
}

export interface SourceSignals {
  performance_reality?: PerformanceSignal;
  early_warnings?: WarningSignal[];
  channel_state?: ChannelStateSignal;
  client_agent_policy?: PolicySignal;
  creative_director?: CreativeSignal;
}

export interface PerformanceSignal {
  true_score: number;
  perceived_score: number;
  confidence: number;
}

export interface WarningSignal {
  type: string;
  severity: string;
  active: boolean;
}

export interface ChannelStateSignal {
  fatigue: number;
  momentum: number;
  visibility: number;
}

export interface PolicySignal {
  auto_exec_enabled: boolean;
  risk_threshold: string;
}

export interface CreativeSignal {
  quality_score: number;
  brand_consistency: number;
}

// ============================================================================
// Channel State Types
// ============================================================================

export interface ChannelState {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  workspace_id: string;
  channel: Channel;
  last_post_at?: string;
  posts_last_7_days: number;
  posts_last_30_days: number;
  fatigue_score: number;
  momentum_score: number;
  visibility_score: number;
  engagement_score: number;
  avg_engagement_rate: number;
  best_posting_times: string[];
  metadata: Record<string, unknown>;
}

export interface ChannelHealth {
  channel: Channel;
  health_score: number;
  fatigue: number;
  momentum: number;
  visibility: number;
  engagement: number;
  last_post?: string;
  recommended_wait_hours: number;
}

// ============================================================================
// Planning Types
// ============================================================================

export interface WeeklyPlan {
  client_id: string;
  week_start: string;
  week_end: string;
  schedules: PlannedSchedule[];
  channel_allocation: ChannelAllocation[];
  conflicts: PlanConflict[];
  truth_notes: string[];
}

export interface PlannedSchedule {
  channel: Channel;
  scheduled_for: string;
  asset_id?: string;
  priority: number;
  reasoning: string;
}

export interface ChannelAllocation {
  channel: Channel;
  posts_planned: number;
  optimal_times: string[];
  fatigue_risk: RiskClass;
}

export interface PlanConflict {
  type: 'timing' | 'fatigue' | 'warning' | 'asset' | 'policy';
  description: string;
  severity: RiskClass;
  affected_schedules: string[];
  resolution?: string;
}

// ============================================================================
// Guardrails Types
// ============================================================================

export interface GuardrailCheck {
  passed: boolean;
  reason?: string;
  severity: RiskClass;
}

export interface OrchestrationGuardrailResult {
  allowed: boolean;
  checks: {
    early_warning: GuardrailCheck;
    channel_fatigue: GuardrailCheck;
    policy_compliance: GuardrailCheck;
    truth_layer: GuardrailCheck;
    timing_conflict: GuardrailCheck;
  };
  risk_level: RiskClass;
  blockers: string[];
  warnings: string[];
}

// ============================================================================
// Overview Types
// ============================================================================

export interface OrchestrationOverview {
  total_schedules: number;
  pending_schedules: number;
  completed_today: number;
  blocked_count: number;
  channels_active: number;
  avg_health_score: number;
  conflicts_detected: number;
  high_fatigue_channels: Channel[];
}

export interface ChannelSummary {
  channel: Channel;
  schedules_pending: number;
  schedules_completed: number;
  health: ChannelHealth;
}
