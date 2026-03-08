-- Migration 157: Multi-Domain Success Predictor (MDSP)
-- Phase 114: Probabilistic success likelihood scores

CREATE TABLE IF NOT EXISTS success_prediction_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (domain IN ('creative', 'market', 'region', 'scaling', 'campaign', 'overall')),
  prediction_payload JSONB NOT NULL,
  success_probability NUMERIC NOT NULL CHECK (success_probability >= 0 AND success_probability <= 1),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  horizon_days INTEGER,
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_success_pred_tenant ON success_prediction_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_success_pred_domain ON success_prediction_snapshots(domain);
CREATE INDEX IF NOT EXISTS idx_success_pred_created ON success_prediction_snapshots(created_at DESC);

ALTER TABLE success_prediction_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view success predictions" ON success_prediction_snapshots;
CREATE POLICY "Users can view success predictions" ON success_prediction_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE success_prediction_snapshots IS 'Phase 114: Multi-domain success prediction snapshots';
