-- Migration 125: Unified Signal Matrix & Early Warning Engine
-- Phase 82: Create tables for signal matrix and early warning events

-- ============================================================================
-- Table: unified_signal_matrix
-- ============================================================================
CREATE TABLE IF NOT EXISTS unified_signal_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_id uuid REFERENCES contacts(id),
  scope text NOT NULL CHECK (scope IN ('global', 'client', 'channel', 'campaign')),
  signal_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  completeness_score numeric NOT NULL CHECK (completeness_score >= 0 AND completeness_score <= 1),
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  anomaly_score numeric NOT NULL CHECK (anomaly_score >= 0 AND anomaly_score <= 1),
  trend_shift_score numeric NOT NULL CHECK (trend_shift_score >= 0 AND trend_shift_score <= 1),
  fatigue_score numeric NOT NULL CHECK (fatigue_score >= 0 AND fatigue_score <= 1)
);

-- Indexes for unified_signal_matrix
CREATE INDEX IF NOT EXISTS idx_unified_signal_matrix_created_at ON unified_signal_matrix(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_signal_matrix_client_id ON unified_signal_matrix(client_id);
CREATE INDEX IF NOT EXISTS idx_unified_signal_matrix_scope ON unified_signal_matrix(scope);

-- RLS for unified_signal_matrix
ALTER TABLE unified_signal_matrix ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read all matrix rows
CREATE POLICY unified_signal_matrix_select ON unified_signal_matrix
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- Policy: system can insert matrix rows
CREATE POLICY unified_signal_matrix_insert ON unified_signal_matrix
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- Table: early_warning_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS early_warning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  client_id uuid REFERENCES contacts(id),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  warning_type text NOT NULL CHECK (warning_type IN (
    'trend_shift', 'collapse_risk', 'fatigue', 'operational_stress',
    'story_stall', 'creative_drift', 'scaling_pressure',
    'performance_conflict', 'data_gap', 'blindspot'
  )),
  title text NOT NULL,
  description_markdown text NOT NULL,
  source_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  timeframe_start timestamptz,
  timeframe_end timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  resolved_at timestamptz,
  -- Keep FK reference to auth.users (allowed in migrations)
resolved_by_user_id uuid REFERENCES auth.users(id)
);

-- Indexes for early_warning_events
CREATE INDEX IF NOT EXISTS idx_early_warning_events_created_at ON early_warning_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_early_warning_events_severity ON early_warning_events(severity);
CREATE INDEX IF NOT EXISTS idx_early_warning_events_warning_type ON early_warning_events(warning_type);
CREATE INDEX IF NOT EXISTS idx_early_warning_events_client_id ON early_warning_events(client_id);
CREATE INDEX IF NOT EXISTS idx_early_warning_events_status ON early_warning_events(status);

-- RLS for early_warning_events
ALTER TABLE early_warning_events ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read all warnings
CREATE POLICY early_warning_events_select ON early_warning_events
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- Policy: system can insert warnings
CREATE POLICY early_warning_events_insert ON early_warning_events
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- Policy: founders and admins can update status
CREATE POLICY early_warning_events_update ON early_warning_events
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
-- Table: early_warning_factors
-- ============================================================================
CREATE TABLE IF NOT EXISTS early_warning_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  factor_name text NOT NULL UNIQUE,
  threshold numeric NOT NULL CHECK (threshold >= 0 AND threshold <= 1),
  weight numeric NOT NULL CHECK (weight >= 0 AND weight <= 1),
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- RLS for early_warning_factors
ALTER TABLE early_warning_factors ENABLE ROW LEVEL SECURITY;

-- Policy: founders and admins can read factors
CREATE POLICY early_warning_factors_select ON early_warning_factors
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('admin', 'owner')
    )
  );

-- Policy: admins can update factors
CREATE POLICY early_warning_factors_update ON early_warning_factors
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
-- Trigger: update updated_at on factors change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_early_warning_factors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS early_warning_factors_updated_at ON early_warning_factors;
CREATE TRIGGER early_warning_factors_updated_at
  BEFORE UPDATE ON early_warning_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_early_warning_factors_updated_at();

-- ============================================================================
-- Seed default warning factors (Balanced Mode thresholds)
-- ============================================================================
INSERT INTO early_warning_factors (factor_name, threshold, weight, metadata) VALUES
  ('trend_shift', 0.65, 0.15, '{"description": "Detects meaningful trend movements across signals", "mode": "balanced"}'),
  ('collapse_risk', 0.75, 0.20, '{"description": "Detects risk of performance collapse", "mode": "balanced"}'),
  ('fatigue', 0.60, 0.12, '{"description": "Detects creative or audience fatigue", "mode": "balanced"}'),
  ('operational_stress', 0.70, 0.10, '{"description": "Detects operational capacity issues", "mode": "balanced"}'),
  ('story_stall', 0.55, 0.08, '{"description": "Detects stalled narrative momentum", "mode": "balanced"}'),
  ('creative_drift', 0.60, 0.10, '{"description": "Detects deviation from brand guidelines", "mode": "balanced"}'),
  ('scaling_pressure', 0.70, 0.10, '{"description": "Detects scaling constraints", "mode": "balanced"}'),
  ('performance_conflict', 0.65, 0.08, '{"description": "Detects conflicts between perceived and reality", "mode": "balanced"}'),
  ('data_gap', 0.50, 0.05, '{"description": "Detects missing or incomplete data", "mode": "balanced"}'),
  ('blindspot', 0.60, 0.02, '{"description": "Detects unmonitored risk areas", "mode": "balanced"}')
ON CONFLICT (factor_name) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE unified_signal_matrix IS 'Stores normalised signals from all engines for daily evaluation cycles';
COMMENT ON TABLE early_warning_events IS 'Stores warnings generated by Early Warning Engine with severity and status';
COMMENT ON TABLE early_warning_factors IS 'Configurable thresholds and weights for early warning generation';
