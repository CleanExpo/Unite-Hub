-- Migration 148: Signal Purity Engine (SPE)
-- Phase 105: Filters noise, bias, and cross-engine contamination

CREATE TABLE IF NOT EXISTS signal_purity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_engine TEXT NOT NULL,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  purity_score NUMERIC NOT NULL CHECK (purity_score >= 0 AND purity_score <= 1),
  noise_factors JSONB NOT NULL DEFAULT '[]',
  bias_flags JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_purity_engine ON signal_purity_snapshots(source_engine);
CREATE INDEX IF NOT EXISTS idx_signal_purity_tenant ON signal_purity_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signal_purity_created ON signal_purity_snapshots(created_at DESC);

ALTER TABLE signal_purity_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view signal purity" ON signal_purity_snapshots;
CREATE POLICY "Users can view signal purity" ON signal_purity_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE signal_purity_snapshots IS 'Phase 105: Signal purity scoring and noise/bias detection';
