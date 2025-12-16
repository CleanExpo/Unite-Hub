-- Guardian Phase G47: Risk Score (Standard Model)
-- Migration: 549
-- Purpose: Store daily risk scores computed from alerts and incidents
-- Tables: guardian_risk_scores

-- ============================================================================
-- TABLE: guardian_risk_scores
-- ============================================================================
-- Stores daily risk scores per tenant (0-100 scale)
-- Standard model: Severity-weighted alerts + incidents with time decay
-- Used for governance dashboards and trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_risk_scores_tenant_date
  ON guardian_risk_scores (tenant_id, date DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_risk_scores ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own risk scores
CREATE POLICY tenant_rw_guardian_risk_scores
  ON guardian_risk_scores
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
CREATE POLICY service_all_guardian_risk_scores
  ON guardian_risk_scores
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_risk_scores IS 'Daily risk scores (0-100) computed from alerts and incidents';
COMMENT ON COLUMN guardian_risk_scores.score IS 'Risk score (0-100): 0=low risk, 100=critical risk';
COMMENT ON COLUMN guardian_risk_scores.breakdown IS 'Score breakdown (alert counts, incident counts, weights, decay)';
COMMENT ON COLUMN guardian_risk_scores.date IS 'Date this score was computed for (YYYY-MM-DD)';
