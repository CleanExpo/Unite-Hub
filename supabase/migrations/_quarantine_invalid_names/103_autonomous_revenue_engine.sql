-- Migration 103: Autonomous Revenue Engine
-- Required by Phase 51 - Autonomous Revenue Engine (ARE)
-- Multi-agent revenue growth opportunities and actions

-- Revenue opportunities table
CREATE TABLE IF NOT EXISTS revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Type check
  CONSTRAINT revenue_opportunities_type_check CHECK (
    type IN (
      'upsell', 'cross_sell', 'feature_expansion',
      'retention_intervention', 'credit_marketplace_offer'
    )
  ),

  -- Foreign key
  CONSTRAINT revenue_opportunities_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_org ON revenue_opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_type ON revenue_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_confidence ON revenue_opportunities(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_created ON revenue_opportunities(created_at DESC);

-- Enable RLS
ALTER TABLE revenue_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY revenue_opportunities_select ON revenue_opportunities
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY revenue_opportunities_insert ON revenue_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE revenue_opportunities IS 'Detected revenue growth opportunities (Phase 51)';

-- Revenue actions table
CREATE TABLE IF NOT EXISTS revenue_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT NOT NULL,
  result TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Action type check
  CONSTRAINT revenue_actions_type_check CHECK (
    action_type IN (
      'send_email', 'voice_outreach', 'offer_upgrade',
      'trigger_client_journey_action', 'deep_agent_sequence'
    )
  ),

  -- Result check
  CONSTRAINT revenue_actions_result_check CHECK (
    result IN ('pending', 'sent', 'accepted', 'declined', 'failed')
  ),

  -- Foreign key
  CONSTRAINT revenue_actions_opportunity_fk
    FOREIGN KEY (opportunity_id) REFERENCES revenue_opportunities(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_actions_opportunity ON revenue_actions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_revenue_actions_type ON revenue_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_revenue_actions_performed ON revenue_actions(performed_at DESC);

-- Enable RLS
ALTER TABLE revenue_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY revenue_actions_select ON revenue_actions
  FOR SELECT TO authenticated
  USING (opportunity_id IN (
    SELECT id FROM revenue_opportunities
    WHERE org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  ));

CREATE POLICY revenue_actions_insert ON revenue_actions
  FOR INSERT TO authenticated
  WITH CHECK (opportunity_id IN (
    SELECT id FROM revenue_opportunities
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE revenue_actions IS 'Actions taken on revenue opportunities (Phase 51)';
