-- Migration 162: Performance Equality Normalizer (PEN)
-- Phase 119: Normalizes performance comparisons

CREATE TABLE IF NOT EXISTS performance_normalization_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('tenant', 'region', 'campaign', 'global')),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  normalization_factors JSONB NOT NULL,
  adjusted_metrics JSONB NOT NULL,
  raw_metrics JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_norm_tenant ON performance_normalization_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perf_norm_scope ON performance_normalization_snapshots(scope);
CREATE INDEX IF NOT EXISTS idx_perf_norm_created ON performance_normalization_snapshots(created_at DESC);

ALTER TABLE performance_normalization_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view normalized performance" ON performance_normalization_snapshots;
CREATE POLICY "Users can view normalized performance" ON performance_normalization_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE performance_normalization_snapshots IS 'Phase 119: Performance normalization snapshots';
