-- Migration 139: AI Navigator Mode (Founder Executive Copilot)
-- Phase 96: Executive reasoning system with truth-layer compliance

-- Navigator snapshots table
CREATE TABLE IF NOT EXISTS navigator_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  priority_map JSONB NOT NULL DEFAULT '{}',
  action_suggestions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Navigator insights table
CREATE TABLE IF NOT EXISTS navigator_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES navigator_snapshots(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('opportunity', 'warning', 'performance', 'compliance', 'creative', 'scaling', 'market', 'strategic')),
  title TEXT NOT NULL,
  detail JSONB NOT NULL,
  confidence_band TEXT NOT NULL CHECK (confidence_band IN ('high', 'medium', 'low', 'exploratory')),
  uncertainty_notes TEXT,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  source_signals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for navigator_snapshots
CREATE INDEX IF NOT EXISTS idx_navigator_snapshots_tenant ON navigator_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_navigator_snapshots_region ON navigator_snapshots(region_id);
CREATE INDEX IF NOT EXISTS idx_navigator_snapshots_created ON navigator_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_navigator_snapshots_confidence ON navigator_snapshots(confidence DESC);

-- Indexes for navigator_insights
CREATE INDEX IF NOT EXISTS idx_navigator_insights_snapshot ON navigator_insights(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_navigator_insights_category ON navigator_insights(category);
CREATE INDEX IF NOT EXISTS idx_navigator_insights_priority ON navigator_insights(priority DESC);
CREATE INDEX IF NOT EXISTS idx_navigator_insights_confidence ON navigator_insights(confidence_band);

-- RLS policies
ALTER TABLE navigator_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigator_insights ENABLE ROW LEVEL SECURITY;

-- RLS for navigator_snapshots
CREATE POLICY "Users can view their tenant navigator snapshots"
  ON navigator_snapshots FOR SELECT
  USING (
    tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
    OR tenant_id IS NULL
  );

CREATE POLICY "Users can insert navigator snapshots for their tenant"
  ON navigator_snapshots FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
    OR tenant_id IS NULL
  );

-- RLS for navigator_insights
CREATE POLICY "Users can view insights for their snapshots"
  ON navigator_insights FOR SELECT
  USING (
    snapshot_id IN (
      SELECT id FROM navigator_snapshots WHERE tenant_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
      OR tenant_id IS NULL
    )
  );

CREATE POLICY "Users can insert insights for their snapshots"
  ON navigator_insights FOR INSERT
  WITH CHECK (
    snapshot_id IN (
      SELECT id FROM navigator_snapshots WHERE tenant_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
      OR tenant_id IS NULL
    )
  );

-- Function to get latest snapshot for tenant
CREATE OR REPLACE FUNCTION get_latest_navigator_snapshot(p_tenant_id UUID)
RETURNS SETOF navigator_snapshots AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM navigator_snapshots
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get priority insights
CREATE OR REPLACE FUNCTION get_priority_insights(p_snapshot_id UUID, p_min_priority INTEGER DEFAULT 7)
RETURNS SETOF navigator_insights AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM navigator_insights
  WHERE snapshot_id = p_snapshot_id
    AND priority >= p_min_priority
  ORDER BY priority DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE navigator_snapshots IS 'Phase 96: AI Navigator executive reasoning snapshots';
COMMENT ON TABLE navigator_insights IS 'Phase 96: Individual insights from navigator analysis';
COMMENT ON COLUMN navigator_insights.confidence_band IS 'high (>70%) | medium (50-70%) | low (30-50%) | exploratory (<30%)';
COMMENT ON COLUMN navigator_insights.uncertainty_notes IS 'Required truth layer disclosure';
