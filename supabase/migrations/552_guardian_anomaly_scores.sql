-- Guardian Phase H02: AI-Powered Anomaly Detection Engine
-- Migration: 552
-- Purpose: Store AI-generated anomaly detection results
-- Tables: guardian_anomaly_scores

-- ============================================================================
-- TABLE: guardian_anomaly_scores
-- ============================================================================
-- Stores AI-powered anomaly detection results per tenant
-- Uses Claude Sonnet 4.5 to analyze alert/incident patterns
-- Privacy-friendly: No raw prompts or user data stored
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_anomaly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  anomaly_score NUMERIC(4, 3) NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
  confidence NUMERIC(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  contributing_alert_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  contributing_incident_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_anomaly_scores_tenant_window
  ON guardian_anomaly_scores (tenant_id, window_end DESC);

CREATE INDEX idx_guardian_anomaly_scores_created
  ON guardian_anomaly_scores (tenant_id, created_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_anomaly_scores ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own anomaly scores
CREATE POLICY tenant_rw_guardian_anomaly_scores
  ON guardian_anomaly_scores
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
CREATE POLICY service_all_guardian_anomaly_scores
  ON guardian_anomaly_scores
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_anomaly_scores IS 'AI-powered anomaly detection results (privacy-friendly)';
COMMENT ON COLUMN guardian_anomaly_scores.anomaly_score IS 'Anomaly score 0-1 (0=normal, 1=highly anomalous)';
COMMENT ON COLUMN guardian_anomaly_scores.confidence IS 'AI confidence in anomaly detection (0-1)';
COMMENT ON COLUMN guardian_anomaly_scores.contributing_alert_ids IS 'Alert event IDs contributing to anomaly';
COMMENT ON COLUMN guardian_anomaly_scores.contributing_incident_ids IS 'Incident IDs contributing to anomaly';
COMMENT ON COLUMN guardian_anomaly_scores.explanation IS 'AI-generated explanation of detected anomaly';
