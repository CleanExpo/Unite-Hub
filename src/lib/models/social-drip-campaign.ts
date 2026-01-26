/**
 * Social Drip Campaign Types
 *
 * Enhanced campaign system with visual builder, A/B testing, and multi-channel support
 *
 * @module lib/models/social-drip-campaign
 */

import { DripCampaign, CampaignStep, CampaignEnrollment } from './drip-campaign';

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

/**
 * Enhanced drip campaign with visual builder and A/B testing
 */
export interface SocialDripCampaign extends Omit<DripCampaign, 'steps'> {
  campaign_type: 'linear' | 'branching' | 'ab_test';
  canvas_data: CanvasData;
  ab_test_config?: ABTestConfig;
  ab_test_winner_id?: string;
  ab_test_completed_at?: Date;
  goal_metric?: 'open_rate' | 'click_rate' | 'reply_rate' | 'conversion_rate' | 'engagement_score';
  goal_target?: number; // Percentage (e.g., 25.00 for 25%)
  version: number;
  parent_campaign_id?: string;
  steps?: SocialCampaignStep[];
}

/**
 * Visual campaign builder canvas data (ReactFlow format)
 */
export interface CanvasData {
  nodes: VisualNode[];
  edges: VisualEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

/**
 * Visual node for campaign builder
 */
export interface VisualNode {
  id: string; // Matches step.node_id
  type: 'trigger' | 'email' | 'wait' | 'condition' | 'split' | 'action' | 'exit';
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    stepId?: string; // Reference to campaign_steps.id
    config?: any; // Type-specific configuration
  };
}

/**
 * Visual edge connecting nodes
 */
export interface VisualEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: 'default' | 'conditional-true' | 'conditional-false' | 'variant-a' | 'variant-b';
  animated?: boolean;
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  enabled: boolean;
  variants: ABTestVariant[];
  winner_metric: 'open_rate' | 'click_rate' | 'conversion_rate' | 'engagement_score';
  minimum_sample_size: number; // Minimum enrollments before declaring winner
  confidence_threshold: number; // Required confidence level (e.g., 95.0 for 95%)
  auto_select_winner: boolean;
}

/**
 * A/B test variant
 */
export interface ABTestVariant {
  id: string;
  name: string;
  percentage: number; // Traffic split percentage (0-100)
  step_ids: string[]; // Steps belonging to this variant
}

// ============================================================================
// STEP TYPES
// ============================================================================

/**
 * Enhanced campaign step with visual builder and multi-channel support
 */
export interface SocialCampaignStep extends CampaignStep {
  node_id: string;
  node_type: 'trigger' | 'email' | 'wait' | 'condition' | 'split' | 'action' | 'exit';
  node_position: {
    x: number;
    y: number;
  };
  channel_id?: string; // Reference to campaign_channels
  channel_config?: ChannelConfig;
  variant_group?: string; // 'variant_a', 'variant_b', etc.
  variant_percentage?: number; // Traffic split percentage
  parent_split_id?: string; // Parent split node for variants
  conditional_branches?: ConditionalBranch[];
  wait_config?: WaitConfig;
  action_config?: ActionConfig;
}

/**
 * Channel-specific configuration
 */
export interface ChannelConfig {
  // Email
  email?: {
    subject: string;
    preheader?: string;
    body: string;
    body_html?: string;
    personalization_enabled?: boolean;
  };

  // Social Media
  social?: {
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube';
    post_type: 'feed' | 'story' | 'reel' | 'video' | 'carousel';
    content: string;
    media_urls?: string[];
    hashtags?: string[];
    mentions?: string[];
    schedule_time?: Date;
  };

  // SMS
  sms?: {
    message: string;
    media_url?: string;
  };

  // Webhook
  webhook?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    payload?: any;
    retry_on_failure?: boolean;
    max_retries?: number;
  };
}

/**
 * Conditional branch for branching logic
 */
export interface ConditionalBranch {
  id: string;
  condition: Condition;
  target_node_id: string;
  target_step_id?: string;
  label?: string;
}

/**
 * Condition for branching logic
 */
export interface Condition {
  type: 'field' | 'score' | 'tag' | 'event' | 'time' | 'composite';
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains' | 'exists' | 'not_exists' | 'in' | 'not_in';
  field?: string; // Contact field name
  value?: any; // Comparison value
  event_type?: string; // For event-based conditions
  time_window?: number; // Hours for time-based conditions
  sub_conditions?: Condition[]; // For composite conditions
  logic?: 'AND' | 'OR'; // For composite conditions
}

/**
 * Wait configuration
 */
export interface WaitConfig {
  type: 'duration' | 'until_event' | 'until_time';

  // Duration wait
  value?: number;
  unit?: 'minutes' | 'hours' | 'days' | 'weeks';

  // Event-based wait
  event_type?: 'email_open' | 'email_click' | 'reply' | 'form_submit' | 'page_visit';
  max_wait_duration?: number; // Maximum wait time in hours

  // Time-based wait
  target_time?: Date;
  target_day_of_week?: number; // 0-6 (Sunday-Saturday)
  target_hour?: number; // 0-23
}

/**
 * Action configuration
 */
export interface ActionConfig {
  type: 'tag' | 'score' | 'field_update' | 'webhook' | 'segment' | 'notification';

  // Tag action
  tag?: {
    action: 'add' | 'remove';
    tag_name: string;
  };

  // Score action
  score?: {
    change: number; // +/- value
    reason?: string;
  };

  // Field update action
  field_update?: {
    field_name: string;
    value: any;
    operation?: 'set' | 'append' | 'increment';
  };

  // Webhook action
  webhook?: {
    url: string;
    method: 'POST' | 'PUT';
    payload: any;
  };

  // Segment action
  segment?: {
    action: 'add_to' | 'remove_from';
    segment_id: string;
  };

  // Notification action
  notification?: {
    type: 'email' | 'slack' | 'teams';
    recipient: string;
    message: string;
  };
}

// ============================================================================
// WORKFLOW STATE
// ============================================================================

/**
 * Real-time workflow execution state
 */
export interface WorkflowState {
  id: string;
  enrollment_id: string;
  campaign_id: string;
  contact_id: string;
  current_node_id: string;
  current_step_id?: string;
  workflow_status: 'running' | 'waiting' | 'paused' | 'completed' | 'failed' | 'exited';
  execution_path: string[]; // Array of node IDs
  workflow_variables: Record<string, any>; // Runtime variables
  wait_until?: Date;
  wait_for_event?: string;
  retry_count: number;
  max_retries: number;
  assigned_variant?: string;
  variant_assigned_at?: Date;
  started_at: Date;
  last_executed_at?: Date;
  next_execution_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// A/B TEST RESULTS
// ============================================================================

/**
 * A/B test results and metrics
 */
export interface ABTestResult {
  id: string;
  campaign_id: string;
  variant_group: string;
  variant_step_id: string;

  // Raw metrics
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_converted: number;
  total_unsubscribed: number;
  total_bounced: number;

  // Calculated rates
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  conversion_rate: number;
  engagement_score: number;

  // Statistical significance
  confidence_level: number; // 0-100%
  p_value: number;
  is_statistically_significant: boolean;
  is_winner: boolean;

  // Timestamps
  test_started_at: Date;
  test_ended_at?: Date;
  winner_declared_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// CAMPAIGN EVENTS
// ============================================================================

/**
 * Campaign event types
 */
export type CampaignEventType =
  | 'email_sent' | 'email_delivered' | 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced'
  | 'sms_sent' | 'sms_delivered' | 'sms_replied'
  | 'social_posted' | 'social_engaged'
  | 'webhook_triggered' | 'webhook_succeeded' | 'webhook_failed'
  | 'tag_added' | 'tag_removed'
  | 'score_updated'
  | 'condition_evaluated'
  | 'wait_started' | 'wait_completed'
  | 'variant_assigned'
  | 'enrollment_started' | 'enrollment_completed' | 'enrollment_exited';

/**
 * Campaign event
 */
export interface CampaignEvent {
  id: string;
  campaign_id: string;
  enrollment_id: string;
  contact_id: string;
  event_type: CampaignEventType;
  event_source: 'system' | 'email_provider' | 'webhook' | 'manual';
  step_id?: string;
  node_id?: string;
  event_data: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  device_type?: string;
  location_data?: {
    city?: string;
    country?: string;
    timezone?: string;
  };
  created_at: Date;
}

// ============================================================================
// CAMPAIGN VERSION
// ============================================================================

/**
 * Campaign version snapshot
 */
export interface CampaignVersion {
  id: string;
  campaign_id: string;
  version: number;
  campaign_snapshot: SocialDripCampaign;
  steps_snapshot: SocialCampaignStep[];
  canvas_snapshot?: CanvasData;
  change_description?: string;
  change_type: 'draft' | 'published' | 'archived' | 'ab_test_started' | 'ab_test_completed';
  created_by?: string;
  created_at: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Campaign builder node configuration by type
 */
export type NodeConfiguration = {
  trigger: {
    trigger_type: 'manual' | 'new_contact' | 'tag' | 'score_threshold' | 'webhook' | 'scheduled';
    trigger_config?: any;
  };
  email: {
    subject: string;
    body: string;
    personalization_enabled?: boolean;
  };
  wait: WaitConfig;
  condition: {
    branches: ConditionalBranch[];
  };
  split: {
    type: 'ab_test' | 'random';
    variants: ABTestVariant[];
  };
  action: ActionConfig;
  exit: {
    reason?: string;
  };
};

/**
 * Campaign execution context
 */
export interface ExecutionContext {
  enrollment: CampaignEnrollment;
  workflow_state: WorkflowState;
  contact: any; // Contact entity
  campaign: SocialDripCampaign;
  current_step: SocialCampaignStep;
  variables: Record<string, any>;
}

/**
 * Campaign metrics aggregation
 */
export interface CampaignMetricsAggregation {
  campaign_id: string;
  total_enrolled: number;
  total_active: number;
  total_completed: number;
  total_exited: number;

  // Email metrics
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;

  // Rates
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;

  // A/B test metrics (if applicable)
  ab_test_results?: ABTestResult[];

  // Step-level breakdown
  step_metrics: Array<{
    step_id: string;
    step_name: string;
    node_type: string;
    executions: number;
    successes: number;
    failures: number;
    success_rate: number;
  }>;
}
