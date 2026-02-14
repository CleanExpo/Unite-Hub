-- Migration 118: Strategic Growth Advisor
-- Required by Phase 66 - Strategic Growth Advisor (SGA)
-- Strategic recommendations and growth planning

-- Advisor recommendations table
CREATE TABLE IF NOT EXISTS advisor_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  brand_id UUID,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  recommendation JSONB NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Category check
  CONSTRAINT advisor_recommendations_category_check CHECK (
    category IN (
      'marketing', 'operations', 'automation', 'staff_training',
      'customer_success', 'revenue', 'risk_mitigation', 'industry_positioning'
    )
  ),

  -- Priority check
  CONSTRAINT advisor_recommendations_priority_check CHECK (
    priority IN ('low', 'medium', 'high', 'critical')
  ),

  -- Confidence check
  CONSTRAINT advisor_recommendations_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT advisor_recommendations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT advisor_recommendations_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_org ON advisor_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_brand ON advisor_recommendations(brand_id);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_category ON advisor_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_priority ON advisor_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_created ON advisor_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE advisor_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY advisor_recommendations_select ON advisor_recommendations
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY advisor_recommendations_insert ON advisor_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY advisor_recommendations_update ON advisor_recommendations
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE advisor_recommendations IS 'Strategic growth recommendations (Phase 66)';
