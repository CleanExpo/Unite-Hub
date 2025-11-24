/**
 * Client Agent Types
 * Phase 83: Type definitions for safety-caged client operations agent
 */

// ============================================================================
// Risk & Safety Types
// ============================================================================

export type RiskLevel = 'low' | 'medium' | 'high';

export type ApprovalStatus =
  | 'auto_executed'
  | 'awaiting_approval'
  | 'approved_executed'
  | 'rejected'
  | 'expired';

export type ActionType =
  | 'send_followup'
  | 'update_status'
  | 'add_tag'
  | 'remove_tag'
  | 'schedule_task'
  | 'generate_content'
  | 'update_score'
  | 'create_note'
  | 'send_notification';

export type SessionType = 'operational' | 'conversational' | 'review';
export type SessionStatus = 'active' | 'completed' | 'paused' | 'error';

// ============================================================================
// Policy Types
// ============================================================================

export interface ClientAgentPolicy {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  workspace_id: string;
  agent_enabled: boolean;
  allowed_actions: ActionType[];
  auto_exec_enabled: boolean;
  auto_exec_risk_threshold: RiskLevel;
  low_risk_threshold: number;
  medium_risk_threshold: number;
  max_actions_per_day: number;
  require_human_review_above_score: number;
  respect_early_warnings: boolean;
  pause_on_high_severity_warning: boolean;
  created_by?: string;
  updated_by?: string;
}

export interface PolicyInput {
  client_id?: string;
  workspace_id: string;
  agent_enabled?: boolean;
  allowed_actions?: ActionType[];
  auto_exec_enabled?: boolean;
  auto_exec_risk_threshold?: RiskLevel;
  max_actions_per_day?: number;
  require_human_review_above_score?: number;
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ClientAgentSession {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  workspace_id: string;
  session_type: SessionType;
  status: SessionStatus;
  context_snapshot: ContextSnapshot;
  messages: SessionMessage[];
  actions_proposed: number;
  actions_executed: number;
  actions_rejected: number;
  risk_score_avg: number;
  truth_compliance_score: number;
  ended_at?: string;
  duration_seconds?: number;
  error_message?: string;
  initiated_by?: string;
}

export interface ContextSnapshot {
  client_profile?: ClientProfile;
  recent_interactions?: RecentInteraction[];
  performance_metrics?: PerformanceMetrics;
  early_warnings?: EarlyWarningInfo[];
}

export interface ClientProfile {
  id: string;
  name: string;
  email?: string;
  company?: string;
  status: string;
  ai_score: number;
  tags?: string[];
}

export interface RecentInteraction {
  type: string;
  date: string;
  summary: string;
}

export interface PerformanceMetrics {
  open_rate?: number;
  click_rate?: number;
  response_rate?: number;
  sentiment_trend?: 'up' | 'down' | 'stable';
}

export interface EarlyWarningInfo {
  id: string;
  warning_type: string;
  severity: string;
  message: string;
}

// ============================================================================
// Action Types
// ============================================================================

export interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface DataSource {
  source: string;
  recency: string;
  reliability: number;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  affected_records?: string[];
}

export interface ClientAgentAction {
  id: string;
  created_at: string;
  session_id: string;
  client_id: string | null;
  workspace_id: string;
  action_type: ActionType;
  action_payload: Record<string, unknown>;
  risk_level: RiskLevel;
  risk_score: number;
  risk_factors: RiskFactor[];
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  executed_at?: string;
  execution_result?: ExecutionResult;
  truth_compliant: boolean;
  truth_disclaimers: string[];
  confidence_score: number;
  data_sources: DataSource[];
  triggered_by_warning?: string;
  warning_severity?: string;
  agent_reasoning?: string;
  proposed_by: string;
  execution_mode: 'auto' | 'manual' | 'override';
}

export interface ActionProposal {
  action_type: ActionType;
  action_payload: Record<string, unknown>;
  agent_reasoning: string;
  confidence_score?: number;
  data_sources?: DataSource[];
}

// ============================================================================
// Agent Communication Types
// ============================================================================

export interface AgentRequest {
  session_id?: string;
  client_id?: string;
  workspace_id: string;
  message: string;
  context?: Partial<ContextSnapshot>;
}

export interface AgentResponse {
  session_id: string;
  message: string;
  proposed_actions: ProposedAction[];
  executed_actions: ExecutedAction[];
  safety_info: SafetyInfo;
}

export interface ProposedAction {
  id: string;
  action_type: ActionType;
  description: string;
  risk_level: RiskLevel;
  requires_approval: boolean;
  reasoning: string;
}

export interface ExecutedAction {
  id: string;
  action_type: ActionType;
  result: ExecutionResult;
}

export interface SafetyInfo {
  total_risk_score: number;
  actions_auto_executed: number;
  actions_awaiting_approval: number;
  early_warning_active: boolean;
  truth_compliance: number;
  disclaimers: string[];
}

// ============================================================================
// Guardrails Types
// ============================================================================

export interface GuardrailCheck {
  passed: boolean;
  reason?: string;
  severity: 'block' | 'warn' | 'info';
}

export interface GuardrailResult {
  allowed: boolean;
  checks: {
    policy_check: GuardrailCheck;
    risk_check: GuardrailCheck;
    rate_limit_check: GuardrailCheck;
    early_warning_check: GuardrailCheck;
    truth_layer_check: GuardrailCheck;
  };
  overall_message: string;
}

// ============================================================================
// Planner Types
// ============================================================================

export interface PlannerInput {
  user_message: string;
  context: ContextSnapshot;
  policy: ClientAgentPolicy;
  session_history: SessionMessage[];
}

export interface PlannerOutput {
  response_message: string;
  proposed_actions: ActionProposal[];
  reasoning_trace: string[];
}

// ============================================================================
// Founder Console Types
// ============================================================================

export interface AgentOverview {
  total_sessions: number;
  active_sessions: number;
  actions_today: number;
  auto_executed_today: number;
  awaiting_approval: number;
  rejection_rate: number;
  avg_risk_score: number;
  truth_compliance_avg: number;
  clients_with_warnings: number;
}

export interface ActionSummary {
  action_type: ActionType;
  count: number;
  auto_exec_count: number;
  avg_risk: number;
}
