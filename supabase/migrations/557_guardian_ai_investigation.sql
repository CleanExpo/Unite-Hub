-- Guardian Phase H08: AI Investigation & Natural-Language Query Console
-- Migration: 557
-- Purpose: Add investigation console feature toggle and investigation sessions storage
-- Tables: guardian_ai_investigations, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add investigation_enabled flag)
-- ============================================================================
-- Add investigation console feature toggle to existing AI settings table
-- Idempotent: Only adds if column doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'investigation_enabled'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN investigation_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.investigation_enabled IS 'Enable AI-powered investigation console (H08)';

-- ============================================================================
-- TABLE: guardian_ai_investigations
-- ============================================================================
-- Stores natural-language investigation Q&A sessions
-- Chat-style interaction history for Guardian data exploration
-- Privacy-friendly: No raw prompts or internal system messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL,
  sequence_index INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer_markdown TEXT NOT NULL,
  answer_summary TEXT,
  answer_type TEXT NOT NULL DEFAULT 'generic' CHECK (answer_type IN ('trend', 'outage', 'risk', 'anomaly', 'predictive', 'rules', 'correlation', 'mixed', 'generic')),
  model TEXT NOT NULL,
  key_entities JSONB,
  key_time_window JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_ai_investigations_session
  ON guardian_ai_investigations (tenant_id, session_id, sequence_index);

CREATE INDEX idx_guardian_ai_investigations_tenant_created
  ON guardian_ai_investigations (tenant_id, created_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_investigations ENABLE ROW LEVEL SECURITY;

-- Tenants can view and create their own investigation sessions
CREATE POLICY tenant_rw_guardian_ai_investigations
  ON guardian_ai_investigations
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
CREATE POLICY service_all_guardian_ai_investigations
  ON guardian_ai_investigations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_investigations IS 'AI-powered investigation Q&A sessions for Guardian data exploration';
COMMENT ON COLUMN guardian_ai_investigations.session_id IS 'Session identifier for grouping related questions';
COMMENT ON COLUMN guardian_ai_investigations.sequence_index IS 'Order of questions within session';
COMMENT ON COLUMN guardian_ai_investigations.question IS 'User natural-language question';
COMMENT ON COLUMN guardian_ai_investigations.answer_markdown IS 'AI-generated answer in markdown format';
COMMENT ON COLUMN guardian_ai_investigations.answer_summary IS 'Brief summary of answer (1 sentence)';
COMMENT ON COLUMN guardian_ai_investigations.answer_type IS 'Question type: trend, outage, risk, anomaly, etc.';
COMMENT ON COLUMN guardian_ai_investigations.key_entities IS 'Key entities referenced (rule IDs, incident IDs, etc.)';
COMMENT ON COLUMN guardian_ai_investigations.key_time_window IS 'Inferred time window for question';
