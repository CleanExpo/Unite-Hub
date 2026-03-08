-- Migration 146: Founder Cognitive Map (FCM)
-- Phase 103: Full cognitive visualization

CREATE TABLE IF NOT EXISTS founder_cognitive_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  map JSONB NOT NULL,
  risk_zones JSONB NOT NULL DEFAULT '[]',
  opportunity_clusters JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cognitive_map_tenant ON founder_cognitive_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_map_created ON founder_cognitive_snapshots(created_at DESC);

ALTER TABLE founder_cognitive_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cognitive maps" ON founder_cognitive_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE founder_cognitive_snapshots IS 'Phase 103: Founder-level cognitive map snapshots';
