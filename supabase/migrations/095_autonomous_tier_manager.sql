-- Migration 095: Autonomous Tier Manager
-- Required by Phase 43 - Autonomous Tier Manager (ATM)
-- Tier recommendations and change event tracking

-- Tier recommendations table
CREATE TABLE IF NOT EXISTS tier_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  current_tier TEXT NOT NULL,
  recommended_tier TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  is_auto_generated BOOLEAN NOT NULL DEFAULT true,
  is_seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tier checks
  CONSTRAINT tier_recommendations_current_check CHECK (
    current_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),
  CONSTRAINT tier_recommendations_recommended_check CHECK (
    recommended_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),

  -- Reason code check
  CONSTRAINT tier_recommendations_reason_check CHECK (
    reason_code IN (
      'UNDERUTILISATION',
      'OVERUSE_RISK',
      'FORECAST_RISK',
      'FEATURE_MISMATCH',
      'VOICE_HEAVY_USER',
      'COST_OPTIMISATION'
    )
  ),

  -- Foreign key
  CONSTRAINT tier_recommendations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_org ON tier_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_auto ON tier_recommendations(is_auto_generated);
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_created ON tier_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_unseen
  ON tier_recommendations(org_id) WHERE is_seen = false;

-- Enable RLS
ALTER TABLE tier_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tier_recommendations_select ON tier_recommendations
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY tier_recommendations_insert ON tier_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY tier_recommendations_update ON tier_recommendations
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE tier_recommendations IS 'Auto-generated tier change recommendations (Phase 43)';

-- Tier change events table
CREATE TABLE IF NOT EXISTS tier_change_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  old_tier TEXT NOT NULL,
  new_tier TEXT NOT NULL,
  trigger TEXT NOT NULL,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Trigger check
  CONSTRAINT tier_change_events_trigger_check CHECK (
    trigger IN ('manual', 'auto_approved', 'recommendation_accepted', 'downgrade', 'upgrade')
  ),

  -- Foreign keys
  CONSTRAINT tier_change_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT tier_change_events_user_fk
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tier_change_events_org ON tier_change_events(org_id);
CREATE INDEX IF NOT EXISTS idx_tier_change_events_created ON tier_change_events(created_at DESC);

-- Enable RLS
ALTER TABLE tier_change_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tier_change_events_select ON tier_change_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY tier_change_events_insert ON tier_change_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE tier_change_events IS 'Audit log of all tier changes (Phase 43)';
