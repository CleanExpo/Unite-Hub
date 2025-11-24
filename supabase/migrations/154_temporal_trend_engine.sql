-- Migration 154: Temporal Trend Engine (TTE)
-- Phase 111: Analyzes long-term, seasonal, and cyclical patterns

CREATE TABLE IF NOT EXISTS temporal_trend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('tenant', 'region', 'market', 'global')),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  trend_vectors JSONB NOT NULL,
  seasonality_signals JSONB NOT NULL DEFAULT '[]',
  cycle_patterns JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temporal_trend_scope ON temporal_trend_snapshots(scope);
CREATE INDEX IF NOT EXISTS idx_temporal_trend_tenant ON temporal_trend_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_temporal_trend_created ON temporal_trend_snapshots(created_at DESC);

ALTER TABLE temporal_trend_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view temporal trends" ON temporal_trend_snapshots;
CREATE POLICY "Users can view temporal trends" ON temporal_trend_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE temporal_trend_snapshots IS 'Phase 111: Temporal trend analysis snapshots';
