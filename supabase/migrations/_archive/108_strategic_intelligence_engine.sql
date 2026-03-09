-- Migration 108: Strategic Intelligence Engine
-- Required by Phase 56 - Strategic Intelligence Engine (SIE)
-- AI strategic intelligence for executive insights

-- Strategic insights table
CREATE TABLE IF NOT EXISTS strategic_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  content JSONB NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT strategic_insights_confidence_check CHECK (
    confidence >= 1 AND confidence <= 100
  ),

  -- Foreign key
  CONSTRAINT strategic_insights_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategic_insights_org ON strategic_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_strategic_insights_type ON strategic_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_strategic_insights_created ON strategic_insights(created_at DESC);

-- Enable RLS
ALTER TABLE strategic_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY strategic_insights_select ON strategic_insights
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY strategic_insights_insert ON strategic_insights
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE strategic_insights IS 'AI-generated strategic insights (Phase 56)';

-- Strategic opportunities table
CREATE TABLE IF NOT EXISTS strategic_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_score INTEGER NOT NULL DEFAULT 50,
  confidence INTEGER NOT NULL DEFAULT 50,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Category check
  CONSTRAINT strategic_opportunities_category_check CHECK (
    category IN (
      'revenue_growth', 'client_retention', 'automation_opportunities',
      'workflow_efficiency', 'risk_reduction', 'product_improvement', 'market_trends'
    )
  ),

  -- Score checks
  CONSTRAINT strategic_opportunities_impact_check CHECK (
    impact_score >= 1 AND impact_score <= 100
  ),
  CONSTRAINT strategic_opportunities_confidence_check CHECK (
    confidence >= 1 AND confidence <= 100
  ),

  -- Foreign key
  CONSTRAINT strategic_opportunities_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_org ON strategic_opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_category ON strategic_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_impact ON strategic_opportunities(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_created ON strategic_opportunities(created_at DESC);

-- Enable RLS
ALTER TABLE strategic_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY strategic_opportunities_select ON strategic_opportunities
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY strategic_opportunities_insert ON strategic_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE strategic_opportunities IS 'Strategic opportunities with impact scoring (Phase 56)';
