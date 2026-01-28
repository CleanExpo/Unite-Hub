-- Migration 116: Brand Intelligence Engine
-- Required by Phase 64 - Brand Intelligence Engine (BIE)
-- SWOT analysis and scorecards for brands

-- Brand insights table
CREATE TABLE IF NOT EXISTS brand_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL,
  org_id UUID NOT NULL,
  period TEXT NOT NULL,
  benchmarks_used JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  scorecard JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT brand_insights_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  CONSTRAINT brand_insights_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_insights_brand ON brand_insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_insights_org ON brand_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_brand_insights_period ON brand_insights(period);
CREATE INDEX IF NOT EXISTS idx_brand_insights_created ON brand_insights(created_at DESC);

-- Enable RLS
ALTER TABLE brand_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY brand_insights_select ON brand_insights
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY brand_insights_insert ON brand_insights
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY brand_insights_update ON brand_insights
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE brand_insights IS 'Brand SWOT analysis and scorecards (Phase 64)';
