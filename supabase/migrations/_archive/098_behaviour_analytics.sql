-- Migration 098: Behaviour Analytics
-- Required by Phase 46 - AI Behaviour Analytics Engine (BAE)
-- Event tracking and insight generation

-- Behaviour events table
CREATE TABLE IF NOT EXISTS behaviour_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  token_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT behaviour_events_type_check CHECK (
    event_type IN (
      'page_view',
      'feature_used',
      'feature_abandoned',
      'concierge_interaction',
      'voice_generation',
      'report_generated',
      'project_created',
      'project_completed',
      'billing_action',
      'login',
      'logout'
    )
  ),

  -- Foreign keys
  CONSTRAINT behaviour_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT behaviour_events_user_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_behaviour_events_org ON behaviour_events(org_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_events_user ON behaviour_events(user_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_events_type ON behaviour_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behaviour_events_created ON behaviour_events(created_at DESC);

-- Enable RLS
ALTER TABLE behaviour_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY behaviour_events_select ON behaviour_events
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY behaviour_events_insert ON behaviour_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE behaviour_events IS 'Track user behaviour events for analytics (Phase 46)';

-- Behaviour insights table
CREATE TABLE IF NOT EXISTS behaviour_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  recommendation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Insight type check
  CONSTRAINT behaviour_insights_type_check CHECK (
    insight_type IN (
      'churn_risk',
      'upsell_opportunity',
      'feature_abandonment',
      'feature_adoption',
      'stuck_user',
      'power_user',
      'declining_usage'
    )
  ),

  -- Foreign key
  CONSTRAINT behaviour_insights_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_behaviour_insights_org ON behaviour_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_insights_type ON behaviour_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_behaviour_insights_created ON behaviour_insights(created_at DESC);

-- Enable RLS
ALTER TABLE behaviour_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY behaviour_insights_select ON behaviour_insights
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY behaviour_insights_insert ON behaviour_insights
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE behaviour_insights IS 'Generated insights from behaviour patterns (Phase 46)';
