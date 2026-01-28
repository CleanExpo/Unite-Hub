-- Phase 8 Week 24: Strategy Snapshots Table
-- Stores strategy snapshots for the signoff workflow

-- Create strategy_snapshots table
CREATE TABLE IF NOT EXISTS strategy_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  audit_id UUID NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, audit_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategy_snapshots_client_id
  ON strategy_snapshots(client_id);

CREATE INDEX IF NOT EXISTS idx_strategy_snapshots_created_at
  ON strategy_snapshots(created_at DESC);

-- RLS Policies
ALTER TABLE strategy_snapshots ENABLE ROW LEVEL SECURITY;

-- Staff can view snapshots for their organization's clients
CREATE POLICY strategy_snapshots_select_policy ON strategy_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM seo_client_profiles cp
      JOIN user_organizations uo ON cp.organization_id = uo.org_id
      WHERE cp.client_id = strategy_snapshots.client_id
        AND uo.user_id = auth.uid()
    )
  );

-- System can insert snapshots
CREATE POLICY strategy_snapshots_insert_policy ON strategy_snapshots
  FOR INSERT
  WITH CHECK (true);

-- Update strategy_signoffs table if needed
-- (Already created in migration 054, but adding indexes)
CREATE INDEX IF NOT EXISTS idx_strategy_signoffs_client_audit
  ON strategy_signoffs(client_id, audit_id);

CREATE INDEX IF NOT EXISTS idx_strategy_signoffs_decided_at
  ON strategy_signoffs(decided_at DESC);

-- Comments
COMMENT ON TABLE strategy_snapshots IS 'Stores strategy snapshots with recommendations for signoff';
COMMENT ON COLUMN strategy_snapshots.snapshot_data IS 'JSONB containing StrategySnapshot type data';
