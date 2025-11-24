-- Migration 123: Founder Intelligence Mode
-- Phase 80: Create tables for founder intelligence snapshots, alerts, and preferences

-- ============================================================================
-- Table: founder_intel_snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_intel_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES auth.users(id),
  scope text NOT NULL CHECK (scope IN ('global', 'client', 'cohort', 'segment')),
  client_id uuid REFERENCES contacts(id),
  title text NOT NULL,
  summary_markdown text NOT NULL,
  intelligence_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  opportunity_level text NOT NULL CHECK (opportunity_level IN ('none', 'low', 'medium', 'high')),
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  timeframe_start timestamptz,
  timeframe_end timestamptz,
  data_completeness_score numeric NOT NULL CHECK (data_completeness_score >= 0 AND data_completeness_score <= 1)
);

-- Indexes for founder_intel_snapshots
CREATE INDEX IF NOT EXISTS idx_founder_intel_snapshots_created_at ON founder_intel_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_intel_snapshots_client_id ON founder_intel_snapshots(client_id);
CREATE INDEX IF NOT EXISTS idx_founder_intel_snapshots_scope ON founder_intel_snapshots(scope);

-- RLS for founder_intel_snapshots
ALTER TABLE founder_intel_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read all snapshots
CREATE POLICY founder_intel_snapshots_select ON founder_intel_snapshots
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE role IN ('founder', 'admin', 'owner')
    )
  );

-- Policy: system can insert (service role bypasses RLS)
CREATE POLICY founder_intel_snapshots_insert ON founder_intel_snapshots
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE role IN ('founder', 'admin', 'owner')
    )
  );

-- ============================================================================
-- Table: founder_intel_alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_intel_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_id uuid REFERENCES contacts(id),
  source_engine text NOT NULL CHECK (source_engine IN (
    'agency_director', 'creative_director', 'scaling_engine', 'orm',
    'alignment_engine', 'story_engine', 'vif', 'archive', 'marketing_engine',
    'performance', 'reports', 'touchpoints'
  )),
  alert_type text NOT NULL CHECK (alert_type IN ('risk', 'opportunity', 'anomaly', 'info')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description_markdown text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
  resolved_at timestamptz,
  resolved_by_user_id uuid REFERENCES auth.users(id)
);

-- Indexes for founder_intel_alerts
CREATE INDEX IF NOT EXISTS idx_founder_intel_alerts_created_at ON founder_intel_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_intel_alerts_client_id ON founder_intel_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_founder_intel_alerts_source_engine ON founder_intel_alerts(source_engine);
CREATE INDEX IF NOT EXISTS idx_founder_intel_alerts_status ON founder_intel_alerts(status);
CREATE INDEX IF NOT EXISTS idx_founder_intel_alerts_severity ON founder_intel_alerts(severity);

-- RLS for founder_intel_alerts
ALTER TABLE founder_intel_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read all alerts
CREATE POLICY founder_intel_alerts_select ON founder_intel_alerts
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE role IN ('founder', 'admin', 'owner')
    )
  );

-- Policy: system can insert alerts
CREATE POLICY founder_intel_alerts_insert ON founder_intel_alerts
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE role IN ('founder', 'admin', 'owner')
    )
  );

-- Policy: founders and admins can update status
CREATE POLICY founder_intel_alerts_update ON founder_intel_alerts
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE role IN ('founder', 'admin', 'owner')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE role IN ('founder', 'admin', 'owner')
    )
  );

-- ============================================================================
-- Table: founder_intel_preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_intel_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  risk_thresholds jsonb NOT NULL DEFAULT '{
    "agency_director": 0.7,
    "creative_director": 0.7,
    "scaling_engine": 0.6,
    "orm": 0.7,
    "alignment_engine": 0.6,
    "story_engine": 0.5,
    "vif": 0.6
  }'::jsonb,
  opportunity_preferences jsonb NOT NULL DEFAULT '{
    "min_confidence": 0.6,
    "show_low_opportunities": false,
    "highlight_high_impact": true
  }'::jsonb,
  briefing_schedule jsonb NOT NULL DEFAULT '{
    "weekly": {"day": "monday", "hour": 7},
    "timezone": "Australia/Brisbane"
  }'::jsonb,
  mute_rules jsonb NOT NULL DEFAULT '{
    "muted_engines": [],
    "muted_alert_types": [],
    "muted_clients": []
  }'::jsonb
);

-- Unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_intel_preferences_user_id ON founder_intel_preferences(user_id);

-- RLS for founder_intel_preferences
ALTER TABLE founder_intel_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read their own preferences
CREATE POLICY founder_intel_preferences_select ON founder_intel_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can insert their own preferences
CREATE POLICY founder_intel_preferences_insert ON founder_intel_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own preferences
CREATE POLICY founder_intel_preferences_update ON founder_intel_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Trigger: update updated_at on preferences change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_founder_intel_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS founder_intel_preferences_updated_at ON founder_intel_preferences;
CREATE TRIGGER founder_intel_preferences_updated_at
  BEFORE UPDATE ON founder_intel_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_founder_intel_preferences_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE founder_intel_snapshots IS 'Store periodic and on-demand summarised intelligence for the founder';
COMMENT ON TABLE founder_intel_alerts IS 'Store specific alerts, risks, and opportunities from multiple engines';
COMMENT ON TABLE founder_intel_preferences IS 'Store founder configuration for Intelligence Mode';
