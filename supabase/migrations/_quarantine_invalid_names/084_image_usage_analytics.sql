-- Migration 084: Image Usage Analytics
-- Required by Phase 29 - Image Analytics, Cost Tracking & Utilisation Dashboard
-- Aggregates usage and cost metrics for images per org

CREATE TABLE IF NOT EXISTS image_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_images_generated INTEGER NOT NULL DEFAULT 0,
  total_images_approved INTEGER NOT NULL DEFAULT 0,
  total_images_rejected INTEGER NOT NULL DEFAULT 0,
  total_cost_usd NUMERIC NOT NULL DEFAULT 0,
  by_agent JSONB DEFAULT '{}'::jsonb,
  by_category JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT image_usage_analytics_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint for period
  CONSTRAINT image_usage_analytics_org_period_unique
    UNIQUE (org_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_image_usage_org_period
  ON image_usage_analytics(org_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_image_usage_created
  ON image_usage_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE image_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY image_usage_analytics_select ON image_usage_analytics
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY image_usage_analytics_insert ON image_usage_analytics
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY image_usage_analytics_update ON image_usage_analytics
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE image_usage_analytics IS 'Aggregates usage and cost metrics for images per org (Phase 29)';
