-- Migration 131: Creative Combat Engine
-- Phase 88: A/B Intelligence Layer for creative testing and comparison

-- ============================================================================
-- Table 1: combat_rounds
-- Defines each A/B testing round
-- ============================================================================

CREATE TABLE IF NOT EXISTS combat_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Channel
  channel TEXT NOT NULL CHECK (channel IN ('fb', 'ig', 'tiktok', 'linkedin', 'youtube', 'gmb', 'reddit', 'email', 'x')),

  -- Round configuration
  round_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (round_status IN ('pending', 'running', 'complete', 'inconclusive')),
  strategy TEXT NOT NULL DEFAULT 'classic_ab'
    CHECK (strategy IN ('classic_ab', 'multivariate', 'rapid_cycle')),

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Configuration
  min_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.6,
  min_sample_size INTEGER NOT NULL DEFAULT 100,

  -- Truth layer
  truth_notes TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_combat_rounds_client
  ON combat_rounds(client_id);
CREATE INDEX IF NOT EXISTS idx_combat_rounds_workspace
  ON combat_rounds(workspace_id);
CREATE INDEX IF NOT EXISTS idx_combat_rounds_status
  ON combat_rounds(round_status);
CREATE INDEX IF NOT EXISTS idx_combat_rounds_channel
  ON combat_rounds(channel);
CREATE INDEX IF NOT EXISTS idx_combat_rounds_created
  ON combat_rounds(created_at DESC);

-- ============================================================================
-- Table 2: combat_entries
-- Individual creatives competing in a round
-- ============================================================================

CREATE TABLE IF NOT EXISTS combat_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  round_id UUID NOT NULL REFERENCES combat_rounds(id) ON DELETE CASCADE,
  creative_asset_id UUID NOT NULL,
  posting_execution_id UUID REFERENCES posting_executions(id) ON DELETE SET NULL,

  -- Variant identifier
  variant TEXT NOT NULL DEFAULT 'A' CHECK (variant IN ('A', 'B', 'C', 'D')),

  -- Raw metrics from platform
  raw_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Reality-adjusted metrics (from Performance Reality Engine)
  reality_adjusted_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Scoring
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0,
  score NUMERIC(10,4) NOT NULL DEFAULT 0,

  -- Sample data
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5,4) DEFAULT 0,

  -- Status
  entry_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (entry_status IN ('pending', 'active', 'winner', 'loser', 'tied')),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_combat_entries_round
  ON combat_entries(round_id);
CREATE INDEX IF NOT EXISTS idx_combat_entries_creative
  ON combat_entries(creative_asset_id);
CREATE INDEX IF NOT EXISTS idx_combat_entries_execution
  ON combat_entries(posting_execution_id);
CREATE INDEX IF NOT EXISTS idx_combat_entries_status
  ON combat_entries(entry_status);
CREATE INDEX IF NOT EXISTS idx_combat_entries_score
  ON combat_entries(score DESC);

-- ============================================================================
-- Table 3: combat_results
-- Stores the winner/loser and full match summary
-- ============================================================================

CREATE TABLE IF NOT EXISTS combat_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  round_id UUID NOT NULL REFERENCES combat_rounds(id) ON DELETE CASCADE,
  winner_entry_id UUID REFERENCES combat_entries(id) ON DELETE SET NULL,
  loser_entry_id UUID REFERENCES combat_entries(id) ON DELETE SET NULL,

  -- Result type
  result_type TEXT NOT NULL DEFAULT 'winner'
    CHECK (result_type IN ('winner', 'inconclusive', 'tie')),

  -- Confidence analysis
  confidence_band TEXT NOT NULL DEFAULT 'medium'
    CHECK (confidence_band IN ('low', 'medium', 'high', 'very_high')),
  statistical_significance NUMERIC(5,4) DEFAULT 0,

  -- Score comparison
  winner_score NUMERIC(10,4),
  loser_score NUMERIC(10,4),
  score_difference NUMERIC(10,4),
  score_lift_percent NUMERIC(6,2),

  -- Summary
  summary_markdown TEXT NOT NULL,

  -- Truth layer
  truth_complete BOOLEAN NOT NULL DEFAULT true,
  truth_notes TEXT,

  -- Actions taken
  winner_promoted BOOLEAN NOT NULL DEFAULT false,
  loser_retired BOOLEAN NOT NULL DEFAULT false,
  evolution_triggered BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_combat_results_round
  ON combat_results(round_id);
CREATE INDEX IF NOT EXISTS idx_combat_results_winner
  ON combat_results(winner_entry_id);
CREATE INDEX IF NOT EXISTS idx_combat_results_type
  ON combat_results(result_type);
CREATE INDEX IF NOT EXISTS idx_combat_results_created
  ON combat_results(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE combat_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_results ENABLE ROW LEVEL SECURITY;

-- Round policies
CREATE POLICY "Users can view rounds in their workspace" ON combat_rounds
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage rounds in their workspace" ON combat_rounds
  FOR ALL USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Entry policies
CREATE POLICY "Users can view entries in their rounds" ON combat_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM combat_rounds cr
      WHERE cr.id = combat_entries.round_id
      AND cr.workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage entries" ON combat_entries
  FOR ALL USING (true);

-- Result policies
CREATE POLICY "Users can view results in their rounds" ON combat_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM combat_rounds cr
      WHERE cr.id = combat_results.round_id
      AND cr.workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage results" ON combat_results
  FOR ALL USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get combat stats for workspace
CREATE OR REPLACE FUNCTION get_combat_stats(
  p_workspace_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_rounds', COUNT(*),
    'completed', COUNT(*) FILTER (WHERE round_status = 'complete'),
    'running', COUNT(*) FILTER (WHERE round_status = 'running'),
    'pending', COUNT(*) FILTER (WHERE round_status = 'pending'),
    'inconclusive', COUNT(*) FILTER (WHERE round_status = 'inconclusive')
  ) INTO v_stats
  FROM combat_rounds
  WHERE workspace_id = p_workspace_id
    AND created_at >= now() - (p_days || ' days')::interval;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Get winner stats for workspace
CREATE OR REPLACE FUNCTION get_winner_stats(
  p_workspace_id UUID,
  p_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_results', COUNT(*),
    'winners_found', COUNT(*) FILTER (WHERE result_type = 'winner'),
    'ties', COUNT(*) FILTER (WHERE result_type = 'tie'),
    'inconclusive', COUNT(*) FILTER (WHERE result_type = 'inconclusive'),
    'winners_promoted', COUNT(*) FILTER (WHERE winner_promoted = true),
    'losers_retired', COUNT(*) FILTER (WHERE loser_retired = true),
    'avg_lift_percent', COALESCE(AVG(score_lift_percent) FILTER (WHERE result_type = 'winner'), 0)
  ) INTO v_stats
  FROM combat_results cr
  JOIN combat_rounds r ON r.id = cr.round_id
  WHERE r.workspace_id = p_workspace_id
    AND cr.created_at >= now() - (p_days || ' days')::interval;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update round status when all entries scored
CREATE OR REPLACE FUNCTION check_round_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_pending_count INTEGER;
  v_round combat_rounds;
BEGIN
  -- Count pending entries
  SELECT COUNT(*) INTO v_pending_count
  FROM combat_entries
  WHERE round_id = NEW.round_id
    AND entry_status = 'pending';

  -- If no pending entries, mark round for completion check
  IF v_pending_count = 0 THEN
    SELECT * INTO v_round FROM combat_rounds WHERE id = NEW.round_id;

    IF v_round.round_status = 'running' THEN
      -- Mark for winner determination (will be handled by service)
      UPDATE combat_rounds
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{ready_for_winner}',
        'true'::jsonb
      )
      WHERE id = NEW.round_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_round_completion
  AFTER UPDATE ON combat_entries
  FOR EACH ROW
  WHEN (OLD.entry_status = 'pending' AND NEW.entry_status != 'pending')
  EXECUTE FUNCTION check_round_completion();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE combat_rounds IS 'Phase 88: A/B testing rounds for creative comparison';
COMMENT ON TABLE combat_entries IS 'Phase 88: Individual creatives competing in a round';
COMMENT ON TABLE combat_results IS 'Phase 88: Winner/loser determination and insights';

COMMENT ON COLUMN combat_rounds.strategy IS 'classic_ab | multivariate | rapid_cycle';
COMMENT ON COLUMN combat_entries.confidence IS 'Statistical confidence 0-1';
COMMENT ON COLUMN combat_results.confidence_band IS 'low | medium | high | very_high';
