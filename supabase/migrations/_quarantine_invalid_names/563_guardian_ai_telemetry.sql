-- Guardian Phase H14: AI Telemetry, Cost & Performance Optimizer
-- Migration: 563
-- Purpose: Add usage tracking, budgets, and performance monitoring for all Guardian AI features
-- Tables: guardian_ai_usage_events, guardian_ai_usage_daily, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add budget fields)
-- ============================================================================

DO $$
BEGIN
  -- Add budget fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings' AND column_name = 'max_daily_calls'
  ) THEN
    ALTER TABLE guardian_ai_settings ADD COLUMN max_daily_calls INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings' AND column_name = 'max_daily_tokens'
  ) THEN
    ALTER TABLE guardian_ai_settings ADD COLUMN max_daily_tokens BIGINT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings' AND column_name = 'max_monthly_tokens'
  ) THEN
    ALTER TABLE guardian_ai_settings ADD COLUMN max_monthly_tokens BIGINT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings' AND column_name = 'target_p95_latency_ms'
  ) THEN
    ALTER TABLE guardian_ai_settings ADD COLUMN target_p95_latency_ms INTEGER;
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.max_daily_calls IS 'Optional daily call budget for AI features (advisory)';
COMMENT ON COLUMN guardian_ai_settings.max_daily_tokens IS 'Optional daily token budget (advisory)';
COMMENT ON COLUMN guardian_ai_settings.max_monthly_tokens IS 'Optional monthly token budget (advisory)';
COMMENT ON COLUMN guardian_ai_settings.target_p95_latency_ms IS 'Target P95 latency in ms (advisory)';

-- ============================================================================
-- TABLE: guardian_ai_usage_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'client_error', 'ai_error', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  http_status INTEGER,
  error_code TEXT,
  error_message_truncated TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TABLE: guardian_ai_usage_daily
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_usage_daily (
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  call_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  total_duration_ms BIGINT NOT NULL,
  p95_latency_ms INTEGER,
  total_tokens BIGINT,
  prompt_tokens BIGINT,
  completion_tokens BIGINT,
  last_aggregated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, date, feature, model)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_ai_usage_events_tenant_started
  ON guardian_ai_usage_events (tenant_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_usage_events_feature
  ON guardian_ai_usage_events (tenant_id, feature, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_usage_daily_tenant_date
  ON guardian_ai_usage_daily (tenant_id, date DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_ai_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rw_guardian_ai_usage_events ON guardian_ai_usage_events;
CREATE POLICY tenant_rw_guardian_ai_usage_events
  ON guardian_ai_usage_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_ai_usage_events ON guardian_ai_usage_events;
CREATE POLICY service_all_guardian_ai_usage_events
  ON guardian_ai_usage_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS tenant_select_guardian_ai_usage_daily ON guardian_ai_usage_daily;
CREATE POLICY tenant_select_guardian_ai_usage_daily
  ON guardian_ai_usage_daily
  FOR SELECT
  USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_ai_usage_daily ON guardian_ai_usage_daily;
CREATE POLICY service_all_guardian_ai_usage_daily
  ON guardian_ai_usage_daily
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_usage_events IS 'Per-call AI usage telemetry for cost and performance monitoring';
COMMENT ON TABLE guardian_ai_usage_daily IS 'Daily aggregated AI usage metrics per tenant/feature/model';
COMMENT ON COLUMN guardian_ai_usage_events.duration_ms IS 'Total call duration in milliseconds';
COMMENT ON COLUMN guardian_ai_usage_events.error_message_truncated IS 'Truncated error message (max 200 chars, no PII)';
COMMENT ON COLUMN guardian_ai_usage_daily.p95_latency_ms IS '95th percentile latency in milliseconds';
