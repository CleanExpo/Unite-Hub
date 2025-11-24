/**
 * AMPE Types
 * Phase 85: Type definitions for Autonomous Multi-Channel Posting Engine
 */

export type Channel = 'fb' | 'ig' | 'tiktok' | 'linkedin' | 'youtube' | 'gmb' | 'reddit' | 'email' | 'x';

export type PostingStatus = 'pending' | 'blocked' | 'published' | 'failed' | 'draft_created';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface PostingAttempt {
  id: string;
  created_at: string;
  schedule_id: string;
  client_id: string;
  workspace_id: string;
  channel: Channel;
  attempted_at: string;
  completed_at?: string;
  status: PostingStatus;
  execution_payload?: Record<string, unknown>;
  platform_response?: Record<string, unknown>;
  platform_post_id?: string;
  error_message?: string;
  error_code?: string;
  retry_count: number;
  safety_checks: SafetyCheckResults;
  truth_notes?: string;
  truth_compliant: boolean;
  confidence_score: number;
  triggered_by: string;
  approved_by?: string;
}

export interface ChannelTokens {
  id: string;
  client_id: string;
  workspace_id: string;
  tokens: Record<Channel, ChannelCredentials>;
  channels_connected: Channel[];
  last_validated_at?: string;
  validation_errors: Record<Channel, string>;
}

export interface ChannelCredentials {
  access_token: string;
  refresh_token?: string;
  page_id?: string;
  account_id?: string;
  expires_at?: string;
}

export interface PostingEngineConfig {
  id: string;
  workspace_id?: string;
  engine_enabled: boolean;
  draft_mode_only: boolean;
  auto_publish_low_risk: boolean;
  require_approval_medium: boolean;
  require_approval_high: boolean;
  min_confidence_score: number;
  max_fatigue_score: number;
  block_during_warnings: boolean;
  max_posts_per_hour: number;
  max_posts_per_day: number;
  metadata: Record<string, unknown>;
}

export interface SafetyCheck {
  name: string;
  passed: boolean;
  reason?: string;
  severity: 'info' | 'warning' | 'error';
}

export interface SafetyCheckResults {
  all_passed: boolean;
  checks: SafetyCheck[];
  blocked_by?: string;
  warnings: string[];
  timestamp: string;
}

export interface PostingContext {
  schedule: OrchestrationSchedule;
  config: PostingEngineConfig;
  channelState?: ChannelState;
  earlyWarnings?: EarlyWarning[];
  clientPolicies?: ClientPolicies;
}

export interface OrchestrationSchedule {
  id: string;
  client_id: string;
  workspace_id: string;
  channel: Channel;
  scheduled_for: string;
  status: string;
  risk_level: RiskLevel;
  creative_asset_id?: string;
  content_preview?: Record<string, unknown>;
  priority: number;
  metadata: Record<string, unknown>;
}

export interface ChannelState {
  fatigue_score: number;
  momentum_score: number;
  visibility_score: number;
  engagement_score: number;
  last_post_at?: string;
}

export interface EarlyWarning {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  active: boolean;
}

export interface ClientPolicies {
  auto_publish_enabled: boolean;
  allowed_channels: Channel[];
  require_approval_for: RiskLevel[];
  max_daily_posts: number;
}

export interface PostingPayload {
  content: string;
  media_urls?: string[];
  link?: string;
  hashtags?: string[];
  mentions?: string[];
  scheduled_time?: string;
  metadata?: Record<string, unknown>;
}

export interface PostingResult {
  success: boolean;
  status: PostingStatus;
  platform_post_id?: string;
  platform_response?: Record<string, unknown>;
  error_message?: string;
  error_code?: string;
  draft_url?: string;
}

export interface PostingEngineOverview {
  total_attempts: number;
  published_count: number;
  draft_count: number;
  blocked_count: number;
  failed_count: number;
  channels_active: number;
  avg_confidence: number;
  engine_enabled: boolean;
  draft_mode: boolean;
}
