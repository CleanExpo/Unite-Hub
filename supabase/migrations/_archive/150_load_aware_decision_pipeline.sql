-- Migration 150: Load-Aware Decision Pipeline (LADP)
-- Phase 107: Makes decision flows aware of cognitive and system load

CREATE TABLE IF NOT EXISTS decision_pipeline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  load_state JSONB NOT NULL,
  decision_volume JSONB NOT NULL,
  throttling_recommendations JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decision_pipeline_tenant ON decision_pipeline_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decision_pipeline_created ON decision_pipeline_snapshots(created_at DESC);

ALTER TABLE decision_pipeline_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view decision pipeline" ON decision_pipeline_snapshots;
CREATE POLICY "Users can view decision pipeline" ON decision_pipeline_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE decision_pipeline_snapshots IS 'Phase 107: Load-aware decision pipeline snapshots';
