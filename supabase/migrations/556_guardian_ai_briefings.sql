-- Guardian Phase H07: AI Executive Briefings
-- Migration: 556
-- Purpose: Add executive briefing feature toggle and briefings storage
-- Tables: guardian_ai_briefings, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add briefing_enabled flag)
-- ============================================================================
-- Add executive briefing feature toggle to existing AI settings table
-- Idempotent: Only adds if column doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'briefing_enabled'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN briefing_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.briefing_enabled IS 'Enable AI-generated executive briefings (H07)';

-- ============================================================================
-- TABLE: guardian_ai_briefings
-- ============================================================================
-- Stores AI-generated executive briefings for Guardian activity
-- Narrative summaries with key metrics and recommendations
-- Privacy-friendly: Aggregated metrics only, no raw event data
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_label TEXT NOT NULL CHECK (period_label IN ('24h', '7d', '30d', 'custom')),
  model TEXT NOT NULL,
  summary_markdown TEXT NOT NULL,
  key_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE UNIQUE INDEX idx_guardian_ai_briefings_unique_window
  ON guardian_ai_briefings (tenant_id, period_start, period_end, period_label);

CREATE INDEX idx_guardian_ai_briefings_tenant_created
  ON guardian_ai_briefings (tenant_id, created_at DESC);

CREATE INDEX idx_guardian_ai_briefings_period_label
  ON guardian_ai_briefings (tenant_id, period_label, created_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_briefings ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own briefings
CREATE POLICY tenant_rw_guardian_ai_briefings
  ON guardian_ai_briefings
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
CREATE POLICY service_all_guardian_ai_briefings
  ON guardian_ai_briefings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_briefings IS 'AI-generated executive briefings for Guardian activity (privacy-friendly)';
COMMENT ON COLUMN guardian_ai_briefings.period_label IS 'Time period label: 24h, 7d, 30d, or custom';
COMMENT ON COLUMN guardian_ai_briefings.summary_markdown IS 'AI-generated executive summary (markdown format)';
COMMENT ON COLUMN guardian_ai_briefings.key_metrics IS 'Structured key metrics (JSON): alert counts, risk score, anomaly score, etc.';
COMMENT ON COLUMN guardian_ai_briefings.recommendations IS 'AI-generated recommendations (JSON array)';
COMMENT ON COLUMN guardian_ai_briefings.source_features IS 'Guardian features used: risk, anomaly, correlation, predictive, etc.';
