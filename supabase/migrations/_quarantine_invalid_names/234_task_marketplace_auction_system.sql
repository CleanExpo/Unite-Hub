-- Migration 234: Task Marketplace Auction System
-- Creates tables for task marketplace, agent bidding, and auction results
-- Enables hybrid first-price weighted Vickrey auction model

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Task Marketplace Auctions Table
CREATE TABLE IF NOT EXISTS task_marketplace_auctions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_complexity INTEGER NOT NULL CHECK (task_complexity >= 0 AND task_complexity <= 100),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'BIDDING', 'EVALUATING', 'COMPLETED', 'CANCELLED')),
  winning_agent_id TEXT,
  winning_bid DECIMAL NOT NULL DEFAULT 0,
  price_paid DECIMAL NOT NULL DEFAULT 0,
  runner_up_agent_id TEXT,
  auction_margin DECIMAL,
  bundle_used BOOLEAN DEFAULT FALSE,
  safety_filter_triggered BOOLEAN DEFAULT FALSE,
  total_bids_received INTEGER DEFAULT 0,
  disqualified_count INTEGER DEFAULT 0,
  auction_type TEXT DEFAULT 'hybrid_first_price_weighted_vickrey',
  outcome TEXT CHECK (outcome IN ('success', 'partial_success', 'failure', 'pending')),
  execution_time_ms INTEGER,
  explainability_report JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Marketplace Bids Table
CREATE TABLE IF NOT EXISTS task_marketplace_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auction_id UUID NOT NULL REFERENCES task_marketplace_auctions(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  raw_score DECIMAL NOT NULL,
  final_bid DECIMAL NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  load_factor DECIMAL,
  capability_match INTEGER CHECK (capability_match >= 0 AND capability_match <= 100),
  success_rate INTEGER CHECK (success_rate >= 0 AND success_rate <= 100),
  context_relevance INTEGER CHECK (context_relevance >= 0 AND context_relevance <= 100),
  disqualified BOOLEAN DEFAULT FALSE,
  disqualification_reason TEXT,
  bid_components JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Task Marketplace History Table
CREATE TABLE IF NOT EXISTS task_marketplace_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  auction_id UUID NOT NULL REFERENCES task_marketplace_auctions(id) ON DELETE CASCADE,
  winning_agent_id TEXT NOT NULL,
  runner_up_agent_id TEXT,
  margin DECIMAL,
  synergy_bonus DECIMAL,
  bundle_agents TEXT[], -- Array of agents in bundle if used
  explainability_report JSONB,
  pattern_type TEXT CHECK (pattern_type IN (
    'agent_dominance',
    'load_sensitivity',
    'complexity_correlation',
    'collaboration_benefit',
    'risk_filtering_effectiveness',
    'standard'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Analytics Table
CREATE TABLE IF NOT EXISTS task_marketplace_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  total_auctions INTEGER DEFAULT 0,
  total_agent_bids INTEGER DEFAULT 0,
  avg_bids_per_auction DECIMAL,
  avg_bid_value DECIMAL,
  safety_filter_triggered_count INTEGER DEFAULT 0,
  bundles_used_count INTEGER DEFAULT 0,
  agent_win_stats JSONB, -- { agentId: { wins: X, winRate: Y } }
  complexity_band_stats JSONB, -- { "20-40": { avgBid: X, successRate: Y } }
  detected_patterns JSONB, -- Array of detected patterns
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE task_marketplace_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_marketplace_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_marketplace_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_marketplace_analytics ENABLE ROW LEVEL SECURITY;

-- Service role: Full access
CREATE POLICY task_marketplace_auctions_service_role ON task_marketplace_auctions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY task_marketplace_bids_service_role ON task_marketplace_bids
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY task_marketplace_history_service_role ON task_marketplace_history
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY task_marketplace_analytics_service_role ON task_marketplace_analytics
  FOR ALL USING (true) WITH CHECK (true);

-- Founder role: Select only, scoped to workspace
-- Uses organization-based access control
CREATE POLICY task_marketplace_auctions_founder_select ON task_marketplace_auctions
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY task_marketplace_bids_founder_select ON task_marketplace_bids
  FOR SELECT USING (
    auction_id IN (
      SELECT a.id FROM task_marketplace_auctions a
      INNER JOIN workspaces w ON a.workspace_id = w.id
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY task_marketplace_history_founder_select ON task_marketplace_history
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY task_marketplace_analytics_founder_select ON task_marketplace_analytics
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Indexes for Performance

-- Auction queries
CREATE INDEX idx_task_marketplace_auctions_workspace_status
  ON task_marketplace_auctions(workspace_id, status);

CREATE INDEX idx_task_marketplace_auctions_winning_agent
  ON task_marketplace_auctions(winning_agent_id);

CREATE INDEX idx_task_marketplace_auctions_created
  ON task_marketplace_auctions(workspace_id, created_at DESC);

-- Bid queries
CREATE INDEX idx_task_marketplace_bids_auction
  ON task_marketplace_bids(auction_id);

CREATE INDEX idx_task_marketplace_bids_agent
  ON task_marketplace_bids(agent_id);

CREATE INDEX idx_task_marketplace_bids_final_bid
  ON task_marketplace_bids(final_bid DESC);

-- History queries
CREATE INDEX idx_task_marketplace_history_workspace
  ON task_marketplace_history(workspace_id, created_at DESC);

CREATE INDEX idx_task_marketplace_history_pattern
  ON task_marketplace_history(pattern_type);

-- Analytics queries
CREATE INDEX idx_task_marketplace_analytics_workspace
  ON task_marketplace_analytics(workspace_id);

-- Helper Functions

-- Get active marketplace auctions
CREATE OR REPLACE FUNCTION get_active_marketplace_auctions(p_workspace_id UUID)
RETURNS TABLE (
  auction_id UUID,
  task_title TEXT,
  status TEXT,
  winning_agent_id TEXT,
  bid_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.task_title,
    a.status,
    a.winning_agent_id,
    COALESCE(COUNT(b.id), 0)::INTEGER,
    a.created_at
  FROM task_marketplace_auctions a
  LEFT JOIN task_marketplace_bids b ON a.id = b.auction_id
  WHERE a.workspace_id = p_workspace_id
    AND a.status IN ('PENDING', 'BIDDING', 'EVALUATING')
  GROUP BY a.id, a.task_title, a.status, a.winning_agent_id, a.created_at
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get marketplace statistics
CREATE OR REPLACE FUNCTION get_marketplace_statistics(p_workspace_id UUID)
RETURNS TABLE (
  total_auctions BIGINT,
  total_bids BIGINT,
  avg_bids_per_auction NUMERIC,
  safety_filters_triggered BIGINT,
  bundles_used BIGINT,
  most_winning_agent TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT a.id)::BIGINT,
    COUNT(DISTINCT b.id)::BIGINT,
    ROUND(COUNT(DISTINCT b.id)::NUMERIC / NULLIF(COUNT(DISTINCT a.id), 0), 2),
    COUNT(CASE WHEN a.safety_filter_triggered = TRUE THEN 1 END)::BIGINT,
    COUNT(CASE WHEN a.bundle_used = TRUE THEN 1 END)::BIGINT,
    (SELECT winning_agent_id FROM task_marketplace_auctions
     WHERE workspace_id = p_workspace_id
     GROUP BY winning_agent_id
     ORDER BY COUNT(*) DESC
     LIMIT 1)::TEXT
  FROM task_marketplace_auctions a
  LEFT JOIN task_marketplace_bids b ON a.id = b.auction_id
  WHERE a.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_active_marketplace_auctions TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_statistics TO authenticated;

-- Audit Trigger
CREATE OR REPLACE FUNCTION audit_marketplace_auctions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_marketplace_auctions
BEFORE UPDATE ON task_marketplace_auctions
FOR EACH ROW
EXECUTE FUNCTION audit_marketplace_auctions();

-- Comments for documentation
COMMENT ON TABLE task_marketplace_auctions IS
  'Stores marketplace auctions with winning agents, bids, and outcomes. Hybrid first-price weighted Vickrey model.';

COMMENT ON COLUMN task_marketplace_auctions.auction_type IS
  'Auction model used: hybrid_first_price_weighted_vickrey';

COMMENT ON COLUMN task_marketplace_auctions.safety_filter_triggered IS
  'True if agents were disqualified due to risk >= 80';

COMMENT ON TABLE task_marketplace_bids IS
  'Individual agent bids for marketplace auctions with scoring breakdown';

COMMENT ON TABLE task_marketplace_history IS
  'Historical record of auction outcomes and detected patterns for learning';

COMMENT ON TABLE task_marketplace_analytics IS
  'Aggregated marketplace metrics and agent performance statistics';
