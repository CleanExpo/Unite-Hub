-- Migration 124: Performance Reality Engine
-- Phase 81: Create tables for performance reality snapshots, attribution factors, and external signals

-- ============================================================================
-- Table: performance_reality_snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_reality_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by_user_id uuid REFERENCES auth.users(id),
  scope text NOT NULL CHECK (scope IN ('global', 'client', 'cohort', 'channel', 'campaign')),
  client_id uuid REFERENCES contacts(id),
  channel text CHECK (channel IN ('facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'google', 'email', 'website', 'multi', 'none')),
  campaign_id uuid,
  timeframe_start timestamptz NOT NULL,
  timeframe_end timestamptz NOT NULL,
  perceived_performance_score numeric NOT NULL CHECK (perceived_performance_score >= 0 AND perceived_performance_score <= 100),
  true_performance_score numeric NOT NULL CHECK (true_performance_score >= 0 AND true_performance_score <= 100),
  confidence_low numeric NOT NULL CHECK (confidence_low >= 0 AND confidence_low <= 100),
  confidence_high numeric NOT NULL CHECK (confidence_high >= 0 AND confidence_high <= 100),
  attribution_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  external_context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  false_positive_risk numeric NOT NULL CHECK (false_positive_risk >= 0 AND false_positive_risk <= 1),
  false_negative_risk numeric NOT NULL CHECK (false_negative_risk >= 0 AND false_negative_risk <= 1),
  summary_markdown text NOT NULL
);

-- Indexes for performance_reality_snapshots
CREATE INDEX IF NOT EXISTS idx_perf_reality_snapshots_created_at ON performance_reality_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_reality_snapshots_scope ON performance_reality_snapshots(scope);
CREATE INDEX IF NOT EXISTS idx_perf_reality_snapshots_client_id ON performance_reality_snapshots(client_id);
CREATE INDEX IF NOT EXISTS idx_perf_reality_snapshots_channel ON performance_reality_snapshots(channel);
CREATE INDEX IF NOT EXISTS idx_perf_reality_snapshots_campaign_id ON performance_reality_snapshots(campaign_id);

-- RLS for performance_reality_snapshots
ALTER TABLE performance_reality_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read all snapshots
CREATE POLICY perf_reality_snapshots_select ON performance_reality_snapshots
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- Policy: founders and admins can insert snapshots
CREATE POLICY perf_reality_snapshots_insert ON performance_reality_snapshots
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- Table: performance_attribution_factors
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_attribution_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  default_weight numeric NOT NULL CHECK (default_weight >= 0 AND default_weight <= 1),
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Index for active factors
CREATE INDEX IF NOT EXISTS idx_perf_attribution_factors_active ON performance_attribution_factors(active);

-- RLS for performance_attribution_factors
ALTER TABLE performance_attribution_factors ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read all factors
CREATE POLICY perf_attribution_factors_select ON performance_attribution_factors
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- Policy: admins can update factors
CREATE POLICY perf_attribution_factors_update ON performance_attribution_factors
  FOR UPDATE
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- Table: performance_external_signals
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_external_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('manual', 'import', 'integration')),
  region text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('holiday', 'weather', 'industry_event', 'campaign_conflict', 'platform_issue', 'other')),
  title text NOT NULL,
  description text NOT NULL,
  impact_hint jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for performance_external_signals
CREATE INDEX IF NOT EXISTS idx_perf_external_signals_region ON performance_external_signals(region);
CREATE INDEX IF NOT EXISTS idx_perf_external_signals_timeframe ON performance_external_signals(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_perf_external_signals_type ON performance_external_signals(signal_type);

-- RLS for performance_external_signals
ALTER TABLE performance_external_signals ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read all signals
CREATE POLICY perf_external_signals_select ON performance_external_signals
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- Policy: founders and admins can insert signals
CREATE POLICY perf_external_signals_insert ON performance_external_signals
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- Trigger: update updated_at on attribution factors change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_perf_attribution_factors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS perf_attribution_factors_updated_at ON performance_attribution_factors;
CREATE TRIGGER perf_attribution_factors_updated_at
  BEFORE UPDATE ON performance_attribution_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_perf_attribution_factors_updated_at();

-- ============================================================================
-- Seed default attribution factors
-- ============================================================================
INSERT INTO performance_attribution_factors (name, description, default_weight, metadata) VALUES
  ('creative_quality', 'Quality and relevance of creative assets', 0.20, '{"source": "vif", "metric": "quality_score"}'),
  ('audience_match', 'How well targeting matches ideal audience', 0.15, '{"source": "marketing", "metric": "audience_overlap"}'),
  ('posting_frequency', 'Consistency and timing of content posting', 0.10, '{"source": "marketing", "metric": "post_cadence"}'),
  ('seasonality', 'Seasonal patterns affecting engagement', 0.10, '{"source": "external", "metric": "season_index"}'),
  ('competition_intensity', 'Level of competitive activity in market', 0.10, '{"source": "external", "metric": "competitor_activity"}'),
  ('fatigue_decay', 'Audience fatigue from repeated exposure', 0.10, '{"source": "marketing", "metric": "frequency_cap"}'),
  ('story_coherence', 'Alignment of content with brand story', 0.10, '{"source": "story_engine", "metric": "coherence_score"}'),
  ('ops_capacity', 'Team capacity to execute effectively', 0.10, '{"source": "orm", "metric": "utilization"}'),
  ('budget_sufficiency', 'Whether budget is adequate for goals', 0.05, '{"source": "marketing", "metric": "budget_ratio"}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE performance_reality_snapshots IS 'Store reality-adjusted performance snapshots with attribution and confidence';
COMMENT ON TABLE performance_attribution_factors IS 'Reusable factor definitions for performance attribution models';
COMMENT ON TABLE performance_external_signals IS 'External context signals that influence performance corrections';
