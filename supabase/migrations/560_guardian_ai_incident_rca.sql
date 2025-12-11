-- Guardian Phase H11: AI Incident Root Cause Analysis Assistant
-- Migration: 560
-- Purpose: Add RCA feature toggle and incident RCA storage
-- Tables: guardian_ai_incident_rca, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add rca_enabled flag)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'rca_enabled'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN rca_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.rca_enabled IS 'Enable AI-powered incident root cause analysis (H11)';

-- ============================================================================
-- TABLE: guardian_ai_incident_rca
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_incident_rca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  incident_id TEXT NOT NULL,
  model TEXT NOT NULL,
  severity TEXT,
  impact_scope TEXT,
  rca_markdown TEXT NOT NULL,
  timeline_markdown TEXT NOT NULL,
  primary_cause_summary TEXT,
  contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(4, 3) CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_ai_incident_rca_incident
  ON guardian_ai_incident_rca (tenant_id, incident_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_incident_rca_tenant_created
  ON guardian_ai_incident_rca (tenant_id, created_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_incident_rca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rw_guardian_ai_incident_rca ON guardian_ai_incident_rca;
CREATE POLICY tenant_rw_guardian_ai_incident_rca
  ON guardian_ai_incident_rca
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_ai_incident_rca ON guardian_ai_incident_rca;
CREATE POLICY service_all_guardian_ai_incident_rca
  ON guardian_ai_incident_rca
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_incident_rca IS 'AI-generated root cause analysis for incidents (advisory only)';
COMMENT ON COLUMN guardian_ai_incident_rca.rca_markdown IS 'AI-generated RCA narrative in markdown';
COMMENT ON COLUMN guardian_ai_incident_rca.timeline_markdown IS 'AI-generated timeline of incident events';
COMMENT ON COLUMN guardian_ai_incident_rca.contributing_factors IS 'JSON array of contributing factors with weights';
COMMENT ON COLUMN guardian_ai_incident_rca.recommended_actions IS 'JSON array of recommended follow-up actions';
