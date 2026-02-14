-- Migration 111: Autonomous Marketing Engine
-- Required by Phase 59 - Autonomous Marketing Engine (AME)
-- Marketing campaign and asset automation

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  campaign_type TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  performance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Campaign type check
  CONSTRAINT marketing_campaigns_type_check CHECK (
    campaign_type IN (
      'lead_gen', 'brand_awareness', 'client_retention',
      're_engagement', 'upsell', 'referral'
    )
  ),

  -- Status check
  CONSTRAINT marketing_campaigns_status_check CHECK (
    status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')
  ),

  -- Foreign key
  CONSTRAINT marketing_campaigns_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org ON marketing_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created ON marketing_campaigns(created_at DESC);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY marketing_campaigns_select ON marketing_campaigns
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY marketing_campaigns_insert ON marketing_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY marketing_campaigns_update ON marketing_campaigns
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE marketing_campaigns IS 'Autonomous marketing campaigns (Phase 59)';

-- Marketing assets table
CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  asset_type TEXT NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Asset type check
  CONSTRAINT marketing_assets_type_check CHECK (
    asset_type IN (
      'landing_page', 'email_sequence', 'social_post',
      'video_script', 'ad_creative', 'voice_ad', 'image_asset'
    )
  ),

  -- Foreign key
  CONSTRAINT marketing_assets_campaign_fk
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_assets_campaign ON marketing_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_type ON marketing_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_created ON marketing_assets(created_at DESC);

-- Enable RLS
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY marketing_assets_select ON marketing_assets
  FOR SELECT TO authenticated
  USING (campaign_id IN (
    SELECT id FROM marketing_campaigns
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY marketing_assets_insert ON marketing_assets
  FOR INSERT TO authenticated
  WITH CHECK (campaign_id IN (
    SELECT id FROM marketing_campaigns
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE marketing_assets IS 'Marketing campaign assets (Phase 59)';
