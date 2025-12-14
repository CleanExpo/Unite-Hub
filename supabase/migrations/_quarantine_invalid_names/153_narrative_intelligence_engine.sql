-- Migration 153: Narrative Intelligence Engine (NIE)
-- Phase 110: Builds coherent narratives explaining events

CREATE TABLE IF NOT EXISTS narrative_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('tenant', 'region', 'campaign', 'market', 'global')),
  story_body JSONB NOT NULL,
  supporting_signals JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_narrative_tenant ON narrative_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_narrative_scope ON narrative_snapshots(scope);
CREATE INDEX IF NOT EXISTS idx_narrative_created ON narrative_snapshots(created_at DESC);

ALTER TABLE narrative_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view narratives" ON narrative_snapshots;
CREATE POLICY "Users can view narratives" ON narrative_snapshots FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE narrative_snapshots IS 'Phase 110: Narrative intelligence snapshots';
