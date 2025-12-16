/**
 * Decision Circuits v2.0.0 - Realtime Metrics Ingestion
 * Schema: webhook events, attribution mapping, and metrics rollups
 *
 * Tables:
 * - metrics_webhook_events: Raw, idempotent, signed webhook ledger
 * - metrics_attribution_map: Maps provider objects to circuit execution context
 * - metrics_rollups: Normalized engagement metrics per (test, variant, time)
 *
 * Views:
 * - metrics_rollup_latest: Latest snapshot for dashboard consumption
 */

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE metrics_provider AS ENUM (
    'sendgrid',
    'resend',
    'facebook',
    'instagram',
    'linkedin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE metrics_event_type AS ENUM (
    'email_delivered',
    'email_bounce',
    'email_open',
    'email_click',
    'email_spamreport',
    'email_unsubscribe',
    'social_impression',
    'social_engagement',
    'social_click'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attribution_status AS ENUM (
    'mapped',
    'unmapped',
    'orphaned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLE: metrics_webhook_events
-- Purpose: Raw, idempotent, signed webhook event ledger (append-only)
-- ============================================================================

CREATE TABLE IF NOT EXISTS metrics_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Provider identification
  provider metrics_provider NOT NULL,
  provider_event_id TEXT NOT NULL,  -- Unique event id from provider
  event_type metrics_event_type NOT NULL,

  -- Webhook raw data
  raw_payload JSONB NOT NULL,       -- Complete provider payload
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  signature_algorithm TEXT,          -- 'hmac-sha256', 'ed25519', etc.

  -- Event metadata
  occurred_at TIMESTAMP NOT NULL,    -- When event occurred (provider timestamp)
  received_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Idempotency & reprocessing
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP,
  reprocessing_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT metrics_webhook_events_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT metrics_webhook_unique_per_provider
    UNIQUE (workspace_id, provider, provider_event_id),
  CONSTRAINT metrics_webhook_valid_timestamp
    CHECK (occurred_at <= received_at)
);

CREATE INDEX IF NOT EXISTS idx_metrics_webhook_workspace
  ON metrics_webhook_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metrics_webhook_provider
  ON metrics_webhook_events(workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_metrics_webhook_received
  ON metrics_webhook_events(workspace_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_webhook_processed
  ON metrics_webhook_events(workspace_id, processed, event_type);
CREATE INDEX IF NOT EXISTS idx_metrics_webhook_event_id
  ON metrics_webhook_events(provider_event_id);

-- ============================================================================
-- TABLE: metrics_attribution_map
-- Purpose: Maps provider event/message/post ids to workspace/circuit context
-- ============================================================================

CREATE TABLE IF NOT EXISTS metrics_attribution_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Provider object identification
  provider metrics_provider NOT NULL,
  provider_object_id TEXT NOT NULL,  -- message_id, post_id, etc.

  -- Circuit execution context
  circuit_execution_id TEXT NOT NULL,
  ab_test_id TEXT,
  variant_id TEXT,
  client_id UUID,

  -- Channel context
  channel TEXT NOT NULL CHECK (channel IN ('email', 'social')),
  platform TEXT,                     -- 'sendgrid', 'resend', 'facebook', etc.

  -- Recipient context (minimal PII)
  recipient_hash TEXT,               -- SHA256(email.lower()) for deduplication
  recipient_identifier TEXT,         -- Provider's internal identifier

  -- Attribution health
  status attribution_status NOT NULL DEFAULT 'mapped',
  mapped_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT metrics_attribution_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT metrics_attribution_unique_per_provider
    UNIQUE (workspace_id, provider, provider_object_id),
  CONSTRAINT metrics_attribution_valid_context
    CHECK (
      (channel = 'email' AND platform IN ('sendgrid', 'resend')) OR
      (channel = 'social' AND platform IN ('facebook', 'instagram', 'linkedin'))
    )
);

CREATE INDEX IF NOT EXISTS idx_metrics_attribution_workspace
  ON metrics_attribution_map(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metrics_attribution_circuit
  ON metrics_attribution_map(workspace_id, circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_metrics_attribution_test
  ON metrics_attribution_map(workspace_id, ab_test_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_attribution_provider
  ON metrics_attribution_map(workspace_id, provider, provider_object_id);
CREATE INDEX IF NOT EXISTS idx_metrics_attribution_recipient
  ON metrics_attribution_map(recipient_hash);

-- ============================================================================
-- TABLE: metrics_rollups
-- Purpose: Normalized engagement rollups per (workspace, test, variant, time)
-- ============================================================================

CREATE TABLE IF NOT EXISTS metrics_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Grouping dimensions
  circuit_execution_id TEXT NOT NULL,
  ab_test_id TEXT,
  variant_id TEXT,
  channel TEXT NOT NULL,
  platform TEXT,

  -- Time bucketing (1-hour buckets)
  time_bucket TIMESTAMP NOT NULL,

  -- Email metrics
  email_sent INTEGER DEFAULT 0,
  email_delivered INTEGER DEFAULT 0,
  email_bounced INTEGER DEFAULT 0,
  email_complained INTEGER DEFAULT 0,
  email_unsubscribed INTEGER DEFAULT 0,
  email_opened INTEGER DEFAULT 0,
  email_clicked INTEGER DEFAULT 0,

  -- Social metrics
  social_impressions INTEGER DEFAULT 0,
  social_likes INTEGER DEFAULT 0,
  social_comments INTEGER DEFAULT 0,
  social_shares INTEGER DEFAULT 0,
  social_clicks INTEGER DEFAULT 0,

  -- Derived metrics
  delivery_rate NUMERIC(5, 2),       -- (delivered / sent) * 100
  bounce_rate NUMERIC(5, 2),         -- (bounced / sent) * 100
  complaint_rate NUMERIC(5, 2),      -- (complained / sent) * 100
  unsubscribe_rate NUMERIC(5, 2),    -- (unsubscribed / sent) * 100
  open_rate NUMERIC(5, 2),           -- (opened / delivered) * 100
  click_rate NUMERIC(5, 2),          -- (clicked / delivered) * 100
  engagement_rate NUMERIC(5, 2),     -- ((opened + clicked) / delivered) * 100
  social_engagement_rate NUMERIC(5, 2),  -- ((likes + comments + shares + clicks) / impressions) * 100

  -- Metadata
  event_count INTEGER DEFAULT 0,     -- Total events in this bucket
  last_event_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT metrics_rollups_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT metrics_rollups_valid_rates
    CHECK (
      delivery_rate IS NULL OR (delivery_rate >= 0 AND delivery_rate <= 100) AND
      bounce_rate IS NULL OR (bounce_rate >= 0 AND bounce_rate <= 100) AND
      open_rate IS NULL OR (open_rate >= 0 AND open_rate <= 100) AND
      click_rate IS NULL OR (click_rate >= 0 AND click_rate <= 100)
    )
);

CREATE INDEX IF NOT EXISTS idx_metrics_rollups_workspace
  ON metrics_rollups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metrics_rollups_circuit
  ON metrics_rollups(workspace_id, circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_metrics_rollups_test
  ON metrics_rollups(workspace_id, ab_test_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_rollups_time
  ON metrics_rollups(workspace_id, time_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_rollups_channel
  ON metrics_rollups(workspace_id, channel, time_bucket DESC);

-- ============================================================================
-- VIEW: metrics_rollup_latest
-- Purpose: Latest rollup snapshot per channel/test/variant for dashboard
-- ============================================================================

CREATE OR REPLACE VIEW metrics_rollup_latest AS
SELECT
  r.*
FROM metrics_rollups r
INNER JOIN (
  SELECT
    workspace_id,
    ab_test_id,
    variant_id,
    channel,
    MAX(time_bucket) AS latest_time_bucket
  FROM metrics_rollups
  GROUP BY workspace_id, ab_test_id, variant_id, channel
) latest
ON r.workspace_id = latest.workspace_id
  AND r.ab_test_id = latest.ab_test_id
  AND r.variant_id = latest.variant_id
  AND r.channel = latest.channel
  AND r.time_bucket = latest.latest_time_bucket;

-- ============================================================================
-- VIEW: metrics_attribution_health
-- Purpose: Health summary of attribution mappings per workspace/provider
-- ============================================================================

CREATE OR REPLACE VIEW metrics_attribution_health AS
SELECT
  workspace_id,
  provider,
  COUNT(*) as total_mappings,
  SUM(CASE WHEN status = 'mapped' THEN 1 ELSE 0 END) as mapped_count,
  SUM(CASE WHEN status = 'unmapped' THEN 1 ELSE 0 END) as unmapped_count,
  SUM(CASE WHEN status = 'orphaned' THEN 1 ELSE 0 END) as orphaned_count,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'mapped' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as mapped_percentage,
  MAX(mapped_at) as latest_mapping_at
FROM metrics_attribution_map
GROUP BY workspace_id, provider;

-- ============================================================================
-- TABLE: metrics_backfill_jobs
-- Purpose: Track async backfill jobs for provider historical data
-- ============================================================================

CREATE TABLE IF NOT EXISTS metrics_backfill_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Backfill scope
  provider metrics_provider NOT NULL,
  channel TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,

  -- Processing metadata
  events_processed INTEGER DEFAULT 0,
  events_failed INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by TEXT,

  -- Constraints
  CONSTRAINT metrics_backfill_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_metrics_backfill_workspace
  ON metrics_backfill_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metrics_backfill_status
  ON metrics_backfill_jobs(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_metrics_backfill_provider
  ON metrics_backfill_jobs(workspace_id, provider);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE metrics_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_isolation" ON metrics_webhook_events;
CREATE POLICY "workspace_isolation" ON metrics_webhook_events
  FOR ALL USING (workspace_id = get_current_workspace_id());

ALTER TABLE metrics_attribution_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_isolation" ON metrics_attribution_map;
CREATE POLICY "workspace_isolation" ON metrics_attribution_map
  FOR ALL USING (workspace_id = get_current_workspace_id());

ALTER TABLE metrics_rollups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_isolation" ON metrics_rollups;
CREATE POLICY "workspace_isolation" ON metrics_rollups
  FOR ALL USING (workspace_id = get_current_workspace_id());

ALTER TABLE metrics_backfill_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_isolation" ON metrics_backfill_jobs;
CREATE POLICY "workspace_isolation" ON metrics_backfill_jobs
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE metrics_webhook_events IS 'Raw, idempotent, signed webhook event ledger (append-only). Events are processed asynchronously to normalize and rollup.';
COMMENT ON TABLE metrics_attribution_map IS 'Maps provider-specific object ids (message_id, post_id) to circuit execution context (circuit_execution_id, ab_test_id, variant_id) for proper attribution.';
COMMENT ON TABLE metrics_rollups IS 'Normalized engagement metrics rolled up by (workspace, circuit_execution_id, ab_test_id, variant_id, channel, time_bucket).';
COMMENT ON TABLE metrics_backfill_jobs IS 'Async backfill jobs for retrieving historical metrics from providers when initial syncs are missed.';
COMMENT ON VIEW metrics_rollup_latest IS 'Latest rollup snapshot per channel/test/variant for dashboard and CX09 consumption.';
COMMENT ON VIEW metrics_attribution_health IS 'Attribution mapping health summary showing mapped vs unmapped vs orphaned counts per provider.';
