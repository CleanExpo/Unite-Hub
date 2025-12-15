/**
 * Decision Circuits v2.0.0 - Metrics Ingestion Type Definitions
 * Types for webhook events, attribution mapping, and metrics rollups
 */

/**
 * Supported metrics providers
 */
export type MetricsProvider = 'sendgrid' | 'resend' | 'facebook' | 'instagram' | 'linkedin';

/**
 * Normalized event types across all providers
 */
export type MetricsEventType =
  | 'email_delivered'
  | 'email_bounce'
  | 'email_open'
  | 'email_click'
  | 'email_spamreport'
  | 'email_unsubscribe'
  | 'social_impression'
  | 'social_engagement'
  | 'social_click';

/**
 * Attribution status for mappings
 */
export type AttributionStatus = 'mapped' | 'unmapped' | 'orphaned';

/**
 * Channel type for metrics
 */
export type MetricsChannel = 'email' | 'social';

/**
 * Raw webhook event from provider
 * Stored as-is for audit trail and reprocessing
 */
export interface WebhookEvent {
  id: string;
  workspace_id: string;
  provider: MetricsProvider;
  provider_event_id: string;
  event_type: MetricsEventType;
  raw_payload: Record<string, unknown>;
  signature_verified: boolean;
  signature_algorithm?: string;
  occurred_at: string;
  received_at: string;
  processed: boolean;
  processed_at?: string;
  reprocessing_count: number;
  created_at: string;
}

/**
 * Attribution mapping: provider object → circuit context
 * Links provider event ids (message_id, post_id) to circuit execution
 */
export interface AttributionMap {
  id: string;
  workspace_id: string;
  provider: MetricsProvider;
  provider_object_id: string;
  circuit_execution_id: string;
  ab_test_id?: string;
  variant_id?: string;
  client_id?: string;
  channel: MetricsChannel;
  platform?: string;
  recipient_hash?: string;
  recipient_identifier?: string;
  status: AttributionStatus;
  mapped_at: string;
  created_at: string;
}

/**
 * Normalized metrics rollup (1-hour buckets)
 */
export interface MetricsRollup {
  id: string;
  workspace_id: string;
  circuit_execution_id: string;
  ab_test_id?: string;
  variant_id?: string;
  channel: MetricsChannel;
  platform?: string;
  time_bucket: string;

  // Email metrics
  email_sent: number;
  email_delivered: number;
  email_bounced: number;
  email_complained: number;
  email_unsubscribed: number;
  email_opened: number;
  email_clicked: number;

  // Social metrics
  social_impressions: number;
  social_likes: number;
  social_comments: number;
  social_shares: number;
  social_clicks: number;

  // Derived rates
  delivery_rate?: number;
  bounce_rate?: number;
  complaint_rate?: number;
  unsubscribe_rate?: number;
  open_rate?: number;
  click_rate?: number;
  engagement_rate?: number;
  social_engagement_rate?: number;

  event_count: number;
  last_event_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Backfill job for historical provider data
 */
export interface BackfillJob {
  id: string;
  workspace_id: string;
  provider: MetricsProvider;
  channel: MetricsChannel;
  date_start: string;
  date_end: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  events_processed: number;
  events_failed: number;
  created_at: string;
  created_by?: string;
}

/**
 * Normalized provider event for processing
 * Extracted from raw webhook payload
 */
export interface NormalizedEvent {
  provider: MetricsProvider;
  event_type: MetricsEventType;
  provider_event_id: string;
  provider_object_id: string; // message_id, post_id, etc.
  occurred_at: string;
  recipient_hash?: string;
  recipient_identifier?: string;
  metadata: Record<string, unknown>;
}

/**
 * Attribution input for mapping creation/update
 */
export interface AttributionInput {
  workspace_id: string;
  provider: MetricsProvider;
  provider_object_id: string;
  circuit_execution_id: string;
  ab_test_id?: string;
  variant_id?: string;
  client_id?: string;
  channel: MetricsChannel;
  platform: string;
  recipient_hash?: string;
  recipient_identifier?: string;
}

/**
 * Provider configuration for webhook verification
 */
export interface ProviderConfig {
  provider: MetricsProvider;
  webhook_secret: string;
  signing_algorithm: 'hmac-sha256' | 'ed25519' | 'rsa-sha256';
  header_names: {
    signature: string;
    timestamp: string;
  };
}

/**
 * Webhook verification result
 */
export interface VerificationResult {
  valid: boolean;
  provider: MetricsProvider;
  reason?: string;
}

/**
 * Metrics rollup query filters
 */
export interface RollupFilters {
  workspace_id: string;
  circuit_execution_id?: string;
  ab_test_id?: string;
  variant_id?: string;
  channel?: MetricsChannel;
  time_start?: string;
  time_end?: string;
  limit?: number;
}

/**
 * Attribution health summary
 */
export interface AttributionHealthSummary {
  workspace_id: string;
  provider: MetricsProvider;
  total_mappings: number;
  mapped_count: number;
  unmapped_count: number;
  orphaned_count: number;
  mapped_percentage: number;
  latest_mapping_at?: string;
}

/**
 * Metrics summary for dashboard
 */
export interface MetricsSummary {
  workspace_id: string;
  circuit_execution_id?: string;
  ab_test_id?: string;
  variant_id?: string;
  total_events: number;
  last_ingest_at?: string;
  attribution_health: {
    mapped: number;
    unmapped: number;
    orphaned: number;
  };
  email_stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
  };
  social_stats?: {
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    engagement_rate: number;
  };
}

/**
 * Backfill request
 */
export interface BackfillRequest {
  workspace_id: string;
  provider: MetricsProvider;
  channel: MetricsChannel;
  date_start: string; // YYYY-MM-DD
  date_end: string;   // YYYY-MM-DD
}

/**
 * Backfill response
 */
export interface BackfillResponse {
  job_id: string;
  status: 'pending' | 'processing';
  message: string;
}

/**
 * Default guardrails for metrics ingestion
 */
export const DEFAULT_METRICS_GUARDRAILS = {
  webhook_signature_required: true,
  max_webhook_payload_size_mb: 5,
  idempotency_window_days: 30,
  rollup_time_bucket_hours: 1,
  attribution_unmapped_grace_period_hours: 24,
  max_backfill_days_per_job: 30,
  webhook_timeout_seconds: 30,
} as const;

/**
 * Provider-specific webhook header names
 */
export const PROVIDER_WEBHOOK_HEADERS: Record<MetricsProvider, { signature: string; timestamp?: string }> = {
  sendgrid: {
    signature: 'x-twilio-email-event-webhook-signature',
    timestamp: 'x-twilio-email-event-webhook-timestamp',
  },
  resend: {
    signature: 'svix-signature',
    timestamp: undefined,
  },
  facebook: {
    signature: 'x-hub-signature-256',
    timestamp: undefined,
  },
  instagram: {
    signature: 'x-hub-signature-256',
    timestamp: undefined,
  },
  linkedin: {
    signature: 'x-linkedin-signature',
    timestamp: 'x-linkedin-timestamp',
  },
};

/**
 * Event type mapping by provider
 */
export const PROVIDER_EVENT_MAPPINGS: Record<MetricsProvider, Record<string, MetricsEventType>> = {
  sendgrid: {
    delivered: 'email_delivered',
    bounce: 'email_bounce',
    open: 'email_open',
    click: 'email_click',
    spamreport: 'email_spamreport',
    unsubscribe: 'email_unsubscribe',
  },
  resend: {
    delivered: 'email_delivered',
    bounce: 'email_bounce',
    open: 'email_open',
    click: 'email_click',
    complaint: 'email_spamreport',
    unsubscribe: 'email_unsubscribe',
  },
  facebook: {
    impression: 'social_impression',
    action: 'social_engagement',
    link_click: 'social_click',
  },
  instagram: {
    impression: 'social_impression',
    action: 'social_engagement',
    link_click: 'social_click',
  },
  linkedin: {
    impressionCount: 'social_impression',
    likeCount: 'social_engagement',
    clickCount: 'social_click',
  },
};
