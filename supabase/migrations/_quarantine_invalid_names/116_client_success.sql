-- Migration 116: Client Success Automation
-- Phase 48: Client retention workflows and engagement monitoring

-- Client engagement events table
CREATE TABLE IF NOT EXISTS client_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login', 'page_view', 'task_completed', 'content_generated',
    'visual_created', 'voice_interaction', 'insight_reviewed',
    'export_downloaded', 'settings_updated', 'feedback_given'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Session context
  session_id TEXT,
  page_path TEXT,
  duration_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client success scores table
CREATE TABLE IF NOT EXISTS client_success_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Score components (0-100 each)
  engagement_score INTEGER DEFAULT 0,
  activation_score INTEGER DEFAULT 0,
  progress_score INTEGER DEFAULT 0,
  satisfaction_score INTEGER DEFAULT 0,
  momentum_score INTEGER DEFAULT 0,

  -- Overall score (weighted average)
  overall_score INTEGER DEFAULT 0,

  -- Score trend
  previous_score INTEGER,
  score_change INTEGER DEFAULT 0,
  trend TEXT CHECK (trend IN ('rising', 'stable', 'declining')),

  -- Scoring metadata
  factors_used JSONB DEFAULT '[]'::jsonb,
  calculation_notes TEXT,

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client insights table
CREATE TABLE IF NOT EXISTS client_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Insight details
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'weekly_summary', 'achievement', 'recommendation',
    'milestone', 'trend_alert', 'tip'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),

  -- State
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'acted_on')),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Validity
  valid_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Momentum alerts table (for staff/owner notifications)
CREATE TABLE IF NOT EXISTS client_momentum_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'inactivity', 'score_drop', 'task_stalled',
    'zero_activity', 'churn_risk', 'needs_attention'
  )),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- State
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Data
  alert_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly success emails sent
CREATE TABLE IF NOT EXISTS client_success_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email details
  email_type TEXT NOT NULL CHECK (email_type IN (
    'weekly_insights', 'milestone_celebration',
    'momentum_nudge', 'achievement_badge'
  )),
  subject TEXT NOT NULL,
  content_html TEXT,
  content_text TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Generation metadata
  insights_included JSONB DEFAULT '[]'::jsonb,
  score_at_send INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_engagement_events_client ON client_engagement_events(client_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_org ON client_engagement_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_engagement_events_type ON client_engagement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engagement_events_created ON client_engagement_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_success_scores_client ON client_success_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_success_scores_org ON client_success_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_success_scores_calculated ON client_success_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_client ON client_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_insights_status ON client_insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_type ON client_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_momentum_alerts_org ON client_momentum_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_momentum_alerts_status ON client_momentum_alerts(status);
CREATE INDEX IF NOT EXISTS idx_momentum_alerts_severity ON client_momentum_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_success_emails_client ON client_success_emails(client_id);

-- RLS Policies
ALTER TABLE client_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_success_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_momentum_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_success_emails ENABLE ROW LEVEL SECURITY;

-- Clients can insert their own engagement events
CREATE POLICY "clients_insert_own_events" ON client_engagement_events
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can view their own engagement events
CREATE POLICY "clients_view_own_events" ON client_engagement_events
  FOR SELECT USING (auth.uid() = client_id);

-- Staff can view all engagement events in their org
CREATE POLICY "staff_view_org_events" ON client_engagement_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = client_engagement_events.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Clients can view their own success scores
CREATE POLICY "clients_view_own_scores" ON client_success_scores
  FOR SELECT USING (auth.uid() = client_id);

-- Staff can view all scores in their org
CREATE POLICY "staff_view_org_scores" ON client_success_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = client_success_scores.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Clients can view their own insights
CREATE POLICY "clients_view_own_insights" ON client_insights
  FOR SELECT USING (auth.uid() = client_id);

-- Clients can update their own insights (mark as read)
CREATE POLICY "clients_update_own_insights" ON client_insights
  FOR UPDATE USING (auth.uid() = client_id);

-- Staff can view all momentum alerts in their org
CREATE POLICY "staff_view_org_alerts" ON client_momentum_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = client_momentum_alerts.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Staff can update alerts (acknowledge/resolve)
CREATE POLICY "staff_update_org_alerts" ON client_momentum_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = client_momentum_alerts.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Clients can view their own emails
CREATE POLICY "clients_view_own_emails" ON client_success_emails
  FOR SELECT USING (auth.uid() = client_id);

-- Service role can do everything
CREATE POLICY "service_role_engagement" ON client_engagement_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_scores" ON client_success_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_insights" ON client_insights
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_alerts" ON client_momentum_alerts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_emails" ON client_success_emails
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Update timestamp trigger for scores
CREATE TRIGGER update_client_success_scores_timestamp
  BEFORE UPDATE ON client_success_scores
  FOR EACH ROW EXECUTE FUNCTION update_launch_kit_timestamp();

-- Comments
COMMENT ON TABLE client_engagement_events IS 'Tracks all client engagement activities';
COMMENT ON TABLE client_success_scores IS 'Calculated success scores for clients';
COMMENT ON TABLE client_insights IS 'Generated insights and recommendations for clients';
COMMENT ON TABLE client_momentum_alerts IS 'Alerts for staff when client engagement drops';
COMMENT ON TABLE client_success_emails IS 'Weekly success emails sent to clients';
