-- Migration 102: Client Journey Intelligence
-- Required by Phase 50 - Client Journey Intelligence (CJI)
-- Full-funnel client lifecycle tracking with risk and actions

-- Client journey events table
CREATE TABLE IF NOT EXISTS client_journey_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  org_id UUID NOT NULL,
  stage TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stage check
  CONSTRAINT client_journey_events_stage_check CHECK (
    stage IN (
      'lead', 'qualified_lead', 'onboarding', 'active_project',
      'awaiting_feedback', 'billing', 'retention', 'upsell_candidate', 'churn_risk'
    )
  ),

  -- Foreign keys
  CONSTRAINT client_journey_events_client_fk
    FOREIGN KEY (client_id) REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT client_journey_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_journey_events_client ON client_journey_events(client_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_events_org ON client_journey_events(org_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_events_stage ON client_journey_events(stage);
CREATE INDEX IF NOT EXISTS idx_client_journey_events_occurred ON client_journey_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE client_journey_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_journey_events_select ON client_journey_events
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_journey_events_insert ON client_journey_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE client_journey_events IS 'Client lifecycle events tracking (Phase 50)';

-- Client journey scores table
CREATE TABLE IF NOT EXISTS client_journey_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  org_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT client_journey_scores_risk_check CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),

  -- Foreign keys
  CONSTRAINT client_journey_scores_client_fk
    FOREIGN KEY (client_id) REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT client_journey_scores_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_client ON client_journey_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_org ON client_journey_scores(org_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_risk ON client_journey_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_generated ON client_journey_scores(generated_at DESC);

-- Enable RLS
ALTER TABLE client_journey_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_journey_scores_select ON client_journey_scores
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_journey_scores_insert ON client_journey_scores
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_journey_scores_update ON client_journey_scores
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE client_journey_scores IS 'Client journey scores with risk and actions (Phase 50)';
