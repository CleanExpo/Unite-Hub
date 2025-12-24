-- Guardian Phase H09: AI Explainability & Attribution Hub
-- Migration: 558
-- Purpose: Add explainability feature toggle and explanations storage
-- Tables: guardian_ai_explanations, guardian_ai_settings (extended)

-- ============================================================================
-- EXTEND: guardian_ai_settings (add explainability_enabled flag)
-- ============================================================================
-- Add explainability hub feature toggle to existing AI settings table
-- Idempotent: Only adds if column doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'guardian_ai_settings'
      AND column_name = 'explainability_enabled'
  ) THEN
    ALTER TABLE guardian_ai_settings
    ADD COLUMN explainability_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN guardian_ai_settings.explainability_enabled IS 'Enable AI-powered explainability and attribution (H09)';

-- ============================================================================
-- TABLE: guardian_ai_explanations
-- ============================================================================
-- Stores AI-generated explanations and feature attributions for Guardian objects
-- Unified table for explaining alerts, incidents, correlations, anomalies, risk scores
-- Privacy-friendly: No raw prompts or payloads, aggregated context only
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('alert', 'incident', 'correlation_cluster', 'anomaly_score', 'predictive_score', 'risk_snapshot')),
  entity_id TEXT NOT NULL,
  model TEXT NOT NULL,
  summary_markdown TEXT NOT NULL,
  feature_attributions JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_window JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_ai_explanations_entity
  ON guardian_ai_explanations (tenant_id, entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_ai_explanations_tenant_created
  ON guardian_ai_explanations (tenant_id, created_at DESC);

-- Note: Duplicate prevention handled at application layer
-- (Cannot use DATE() in unique index - not IMMUTABLE)

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_explanations ENABLE ROW LEVEL SECURITY;

-- Tenants can view and create their own explanations
DROP POLICY IF EXISTS tenant_rw_guardian_ai_explanations ON guardian_ai_explanations;
CREATE POLICY tenant_rw_guardian_ai_explanations
  ON guardian_ai_explanations
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
DROP POLICY IF EXISTS service_all_guardian_ai_explanations ON guardian_ai_explanations;
CREATE POLICY service_all_guardian_ai_explanations
  ON guardian_ai_explanations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_explanations IS 'AI-powered explanations and feature attributions for Guardian objects';
COMMENT ON COLUMN guardian_ai_explanations.entity_type IS 'Type of Guardian object: alert, incident, correlation_cluster, anomaly_score, predictive_score, risk_snapshot';
COMMENT ON COLUMN guardian_ai_explanations.entity_id IS 'ID of the entity being explained';
COMMENT ON COLUMN guardian_ai_explanations.summary_markdown IS 'AI-generated explanation in markdown format';
COMMENT ON COLUMN guardian_ai_explanations.feature_attributions IS 'JSON array of contributing factors with weights';
COMMENT ON COLUMN guardian_ai_explanations.context_window IS 'Time window and context used for explanation (JSON)';
