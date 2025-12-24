-- Migration 144: Cognitive Load Balancer (CLB)
-- Phase 101: Region-aware and tenant-aware load balancing

CREATE TABLE IF NOT EXISTS cognitive_load_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  load_vector JSONB NOT NULL,
  recommended_actions JSONB NOT NULL DEFAULT '[]',
  overall_load NUMERIC NOT NULL CHECK (overall_load >= 0 AND overall_load <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cognitive_load_tenant ON cognitive_load_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_load_region ON cognitive_load_snapshots(region_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_load_created ON cognitive_load_snapshots(created_at DESC);

ALTER TABLE cognitive_load_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view load snapshots" ON cognitive_load_snapshots;
CREATE POLICY "Users can view load snapshots" ON cognitive_load_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE cognitive_load_snapshots IS 'Phase 101: Cognitive load balancing snapshots';
