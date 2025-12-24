-- Migration 233: Negotiation and Arbitration System
-- Implements multi-agent negotiation, consensus scoring, and decision arbitration
-- Created: 2025-11-25

-- Agent Negotiation Sessions Table
CREATE TABLE IF NOT EXISTS agent_negotiation_sessions (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id UUID NOT NULL UNIQUE,
  objective TEXT NOT NULL,
  participating_agents TEXT[] NOT NULL, -- Array of agent IDs
  status TEXT NOT NULL CHECK (status IN ('active', 'resolved', 'deadlocked', 'escalated')),
  proposals JSONB NOT NULL, -- Array of proposals with confidence, risk, cost, benefit
  consensus_scores JSONB NOT NULL, -- Array of consensus score objects per agent
  conflicts JSONB NOT NULL, -- Array of detected conflict objects
  transcript TEXT, -- Full negotiation transcript
  final_decision JSONB, -- Selected action and rationale
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_negotiation_sessions_workspace ON agent_negotiation_sessions(workspace_id);
CREATE INDEX idx_negotiation_sessions_status ON agent_negotiation_sessions(status);
CREATE INDEX idx_negotiation_sessions_created ON agent_negotiation_sessions(created_at DESC);

-- Agent Negotiation Proposals Table
CREATE TABLE IF NOT EXISTS agent_negotiation_proposals (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES agent_negotiation_sessions(session_id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL UNIQUE,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('execute', 'skip', 'defer', 'escalate')),
  confidence DECIMAL(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  risk_score DECIMAL(5, 2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  estimated_cost DECIMAL(10, 4) NOT NULL,
  estimated_benefit DECIMAL(10, 4) NOT NULL,
  rationale TEXT NOT NULL,
  supporting_evidence TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_session ON agent_negotiation_proposals(session_id);
CREATE INDEX idx_proposals_agent ON agent_negotiation_proposals(agent_id);

-- Agent Consensus Scores Table
CREATE TABLE IF NOT EXISTS agent_consensus_scores (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES agent_negotiation_sessions(session_id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL,
  risk_adjusted_score DECIMAL(5, 2) NOT NULL,
  weighted_score DECIMAL(5, 2) NOT NULL,
  overall_consensus DECIMAL(5, 2) NOT NULL CHECK (overall_consensus >= 0 AND overall_consensus <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consensus_scores_session ON agent_consensus_scores(session_id);
CREATE INDEX idx_consensus_scores_agent ON agent_consensus_scores(agent_id);

-- Agent Arbitration Decisions Table
CREATE TABLE IF NOT EXISTS agent_arbitration_decisions (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  decision_id UUID NOT NULL UNIQUE,
  session_id UUID NOT NULL REFERENCES agent_negotiation_sessions(session_id) ON DELETE CASCADE,
  selected_agent_id TEXT NOT NULL,
  selected_action TEXT NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  arbitration_score DECIMAL(5, 2) NOT NULL,
  consensus_percentage DECIMAL(5, 2) NOT NULL,
  rationale TEXT NOT NULL,
  predicted_outcome TEXT NOT NULL CHECK (predicted_outcome IN ('high_confidence', 'moderate_confidence', 'low_confidence')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arbitration_decisions_session ON agent_arbitration_decisions(session_id);
CREATE INDEX idx_arbitration_decisions_agent ON agent_arbitration_decisions(selected_agent_id);
CREATE INDEX idx_arbitration_decisions_created ON agent_arbitration_decisions(created_at DESC);

-- Negotiation Transcripts Table
CREATE TABLE IF NOT EXISTS negotiation_transcripts (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES agent_negotiation_sessions(session_id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  transcript_length INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transcripts_session ON negotiation_transcripts(session_id);

-- Negotiation Archives Table (for historical analysis)
CREATE TABLE IF NOT EXISTS negotiation_archives (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  record_id UUID NOT NULL UNIQUE,
  session_id UUID NOT NULL,
  agent_participants TEXT[] NOT NULL,
  objective TEXT NOT NULL,
  proposals_count INT NOT NULL,
  conflicts_detected INT NOT NULL,
  consensus_achieved BOOLEAN NOT NULL,
  consensus_percentage DECIMAL(5, 2) NOT NULL,
  selected_agent TEXT NOT NULL,
  selected_action TEXT NOT NULL,
  decision_outcome TEXT NOT NULL CHECK (decision_outcome IN ('success', 'partial_success', 'failure')),
  time_to_resolution INT NOT NULL, -- milliseconds
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_archives_workspace ON negotiation_archives(workspace_id);
CREATE INDEX idx_archives_created ON negotiation_archives(created_at DESC);
CREATE INDEX idx_archives_outcome ON negotiation_archives(decision_outcome);

-- Negotiation Patterns Table (for learning and analysis)
CREATE TABLE IF NOT EXISTS negotiation_patterns (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('agent_dominance', 'consensus_builder', 'risk_avoider', 'cost_optimizer', 'repeated_conflict')),
  primary_agent TEXT,
  participating_agents TEXT[],
  occurrences INT NOT NULL DEFAULT 1,
  success_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.5,
  avg_consensus_percentage DECIMAL(5, 2),
  avg_resolution_time INT,
  key_insight TEXT,
  first_observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patterns_workspace ON negotiation_patterns(workspace_id);
CREATE INDEX idx_patterns_type ON negotiation_patterns(pattern_type);
CREATE INDEX idx_patterns_agent ON negotiation_patterns(primary_agent);

-- Row Level Security (RLS) Policies

-- Agent Negotiation Sessions RLS
ALTER TABLE agent_negotiation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_negotiation_sessions"
  ON agent_negotiation_sessions
  FOR ALL
  USING (auth.uid() = auth.uid()) -- Always true for service role
  WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "founder_select_negotiation_sessions"
  ON agent_negotiation_sessions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'founder'
    )
  );

-- Arbitration Decisions RLS
ALTER TABLE agent_arbitration_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_arbitration_decisions"
  ON agent_arbitration_decisions
  FOR ALL
  USING (auth.uid() = auth.uid())
  WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "founder_select_arbitration_decisions"
  ON agent_arbitration_decisions
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'founder'
    )
  );

-- Negotiation Archives RLS
ALTER TABLE negotiation_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_archives"
  ON negotiation_archives
  FOR ALL
  USING (auth.uid() = auth.uid())
  WITH CHECK (auth.uid() = auth.uid());

CREATE POLICY "founder_select_archives"
  ON negotiation_archives
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'founder'
    )
  );

-- Helper Function: Get active negotiation session
CREATE OR REPLACE FUNCTION get_active_negotiation_session(p_workspace_id UUID)
RETURNS TABLE (
  session_id UUID,
  objective TEXT,
  participating_agents TEXT[],
  status TEXT,
  proposals_count INT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ans.session_id,
    ans.objective,
    ans.participating_agents,
    ans.status,
    array_length(ans.participating_agents, 1),
    ans.created_at
  FROM agent_negotiation_sessions ans
  WHERE ans.workspace_id = p_workspace_id
    AND ans.status IN ('active', 'deadlocked')
  ORDER BY ans.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Get negotiation statistics
CREATE OR REPLACE FUNCTION get_negotiation_stats(p_workspace_id UUID, p_lookback_days INT DEFAULT 7)
RETURNS TABLE (
  total_negotiations INT,
  consensus_rate DECIMAL,
  avg_resolution_time INT,
  success_rate DECIMAL,
  pattern_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_negotiations,
    (SUM(CASE WHEN na.consensus_achieved THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100) as consensus_rate,
    ROUND(AVG(na.time_to_resolution))::INT as avg_resolution_time,
    (SUM(CASE WHEN na.decision_outcome IN ('success', 'partial_success') THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100) as success_rate,
    (SELECT COUNT(*) FROM negotiation_patterns WHERE workspace_id = p_workspace_id)::INT as pattern_count
  FROM negotiation_archives na
  WHERE na.workspace_id = p_workspace_id
    AND na.created_at >= NOW() - INTERVAL '1 day' * p_lookback_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_negotiation_session TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_negotiation_stats TO anon, authenticated, service_role;

-- Create indexes for performance
CREATE INDEX idx_negotiation_sessions_workspace_status ON agent_negotiation_sessions(workspace_id, status);
CREATE INDEX idx_archives_workspace_outcome ON negotiation_archives(workspace_id, decision_outcome);
CREATE INDEX idx_patterns_workspace_type ON negotiation_patterns(workspace_id, pattern_type);
