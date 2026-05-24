-- Migration 165: Global Insight Renderer (GIR)
-- Phase 122: Renders insights for various audiences

CREATE TABLE IF NOT EXISTS rendered_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  audience_type TEXT NOT NULL CHECK (audience_type IN ('founder', 'franchise', 'team', 'external')),
  render_type TEXT NOT NULL CHECK (render_type IN ('dashboard', 'report', 'summary', 'email', 'briefing')),
  insight_payload JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rendered_insights_tenant ON rendered_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rendered_insights_type ON rendered_insights(render_type);
CREATE INDEX IF NOT EXISTS idx_rendered_insights_created ON rendered_insights(created_at DESC);

ALTER TABLE rendered_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view rendered insights" ON rendered_insights;
CREATE POLICY "Users can view rendered insights" ON rendered_insights FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

COMMENT ON TABLE rendered_insights IS 'Phase 122: Rendered insight outputs';
