-- Migration 161: Creative Risk & Sensitivity Engine (CRSE)
-- Phase 118: Assesses creative content for risk and sensitivity

CREATE TABLE IF NOT EXISTS creative_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_ref JSONB NOT NULL,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  risk_profile JSONB NOT NULL,
  sensitivity_flags JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creative_risk_tenant ON creative_risk_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_creative_risk_region ON creative_risk_assessments(region_id);
CREATE INDEX IF NOT EXISTS idx_creative_risk_created ON creative_risk_assessments(created_at DESC);

ALTER TABLE creative_risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view creative risk" ON creative_risk_assessments;
CREATE POLICY "Users can view creative risk" ON creative_risk_assessments FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

COMMENT ON TABLE creative_risk_assessments IS 'Phase 118: Creative risk and sensitivity assessments';
