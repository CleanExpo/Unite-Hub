-- Migration 235: Coalition Formation System
-- Creates tables for multi-agent coalition formation, role assignment, and pattern learning

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Coalition Formation Proposals Table
CREATE TABLE IF NOT EXISTS coalition_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_complexity INTEGER NOT NULL CHECK (task_complexity >= 0 AND task_complexity <= 100),
  agent_ids TEXT[] NOT NULL,
  synergy_score DECIMAL NOT NULL CHECK (synergy_score >= 0 AND synergy_score <= 100),
  recommended_leader TEXT NOT NULL,
  estimated_outcome DECIMAL CHECK (estimated_outcome >= 0 AND estimated_outcome <= 100),
  safety_approved BOOLEAN DEFAULT FALSE,
  safety_vetoes TEXT[],
  proposal_status TEXT NOT NULL CHECK (proposal_status IN ('proposed', 'accepted', 'rejected', 'executing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coalition Members Table
CREATE TABLE IF NOT EXISTS coalition_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES coalition_proposals(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  primary_role TEXT NOT NULL CHECK (primary_role IN ('leader', 'planner', 'executor', 'validator')),
  secondary_roles TEXT[],
  capability_match INTEGER CHECK (capability_match >= 0 AND capability_match <= 100),
  success_rate INTEGER CHECK (success_rate >= 0 AND success_rate <= 100),
  fallback_agents TEXT[],
  member_status TEXT DEFAULT 'active' CHECK (member_status IN ('active', 'failed', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coalition Roles Table
CREATE TABLE IF NOT EXISTS coalition_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES coalition_proposals(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('leader', 'planner', 'executor', 'validator')),
  conflict_detected BOOLEAN DEFAULT FALSE,
  conflict_reason TEXT,
  arbitration_used BOOLEAN DEFAULT FALSE,
  role_assignment_score INTEGER CHECK (role_assignment_score >= 0 AND role_assignment_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coalition History Table
CREATE TABLE IF NOT EXISTS coalition_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  agent_ids TEXT[] NOT NULL,
  synergy_score DECIMAL NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'partial_success', 'failure')),
  execution_time_ms INTEGER,
  leader_id TEXT,
  health_score DECIMAL,
  member_contributions JSONB, -- { "agent_id": score }
  safety_vetoes TEXT[],
  pattern_type TEXT CHECK (pattern_type IN (
    'high_synergy_coalition',
    'repeated_success_coalition',
    'role_conflict_coalition',
    'overloaded_coalition',
    'safety_filtered_coalition'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coalition Patterns Table
CREATE TABLE IF NOT EXISTS coalition_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'high_synergy_coalition',
    'repeated_success_coalition',
    'role_conflict_coalition',
    'overloaded_coalition',
    'safety_filtered_coalition'
  )),
  occurrence_count INTEGER DEFAULT 1,
  average_synergy DECIMAL,
  success_rate DECIMAL,
  average_execution_time_ms INTEGER,
  agent_combinations TEXT[][],
  insights TEXT[],
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE coalition_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coalition_patterns ENABLE ROW LEVEL SECURITY;

-- Service role: Full access
CREATE POLICY coalition_proposals_service_role ON coalition_proposals
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true) WITH CHECK (true);

CREATE POLICY coalition_members_service_role ON coalition_members
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true) WITH CHECK (true);

CREATE POLICY coalition_roles_service_role ON coalition_roles
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true) WITH CHECK (true);

CREATE POLICY coalition_history_service_role ON coalition_history
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true) WITH CHECK (true);

CREATE POLICY coalition_patterns_service_role ON coalition_patterns
  FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true) WITH CHECK (true);

-- Founder role: Select only, scoped to workspace
CREATE POLICY coalition_proposals_founder_select ON coalition_proposals
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY coalition_members_founder_select ON coalition_members
  FOR SELECT USING (
    proposal_id IN (
      SELECT cp.id FROM coalition_proposals cp
      INNER JOIN workspaces w ON cp.workspace_id = w.id
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY coalition_roles_founder_select ON coalition_roles
  FOR SELECT USING (
    proposal_id IN (
      SELECT cp.id FROM coalition_proposals cp
      INNER JOIN workspaces w ON cp.workspace_id = w.id
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY coalition_history_founder_select ON coalition_history
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY coalition_patterns_founder_select ON coalition_patterns
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Indexes for Performance

-- Coalition proposal queries
CREATE INDEX idx_coalition_proposals_workspace_status
  ON coalition_proposals(workspace_id, proposal_status);

CREATE INDEX idx_coalition_proposals_task
  ON coalition_proposals(task_id);

CREATE INDEX idx_coalition_proposals_created
  ON coalition_proposals(workspace_id, created_at DESC);

-- Coalition member queries
CREATE INDEX idx_coalition_members_proposal
  ON coalition_members(proposal_id);

CREATE INDEX idx_coalition_members_agent
  ON coalition_members(agent_id);

CREATE INDEX idx_coalition_members_role
  ON coalition_members(primary_role);

-- Coalition role queries
CREATE INDEX idx_coalition_roles_proposal
  ON coalition_roles(proposal_id);

CREATE INDEX idx_coalition_roles_agent
  ON coalition_roles(agent_id);

CREATE INDEX idx_coalition_roles_conflict
  ON coalition_roles(conflict_detected);

-- Coalition history queries
CREATE INDEX idx_coalition_history_workspace
  ON coalition_history(workspace_id, created_at DESC);

CREATE INDEX idx_coalition_history_outcome
  ON coalition_history(outcome);

CREATE INDEX idx_coalition_history_pattern
  ON coalition_history(pattern_type);

CREATE INDEX idx_coalition_history_agents
  ON coalition_history USING GIN (agent_ids);

-- Coalition pattern queries
CREATE INDEX idx_coalition_patterns_workspace
  ON coalition_patterns(workspace_id);

CREATE INDEX idx_coalition_patterns_type
  ON coalition_patterns(pattern_type);

-- Helper Functions

-- Get active coalition proposals
CREATE OR REPLACE FUNCTION get_active_coalition_proposals(p_workspace_id UUID)
RETURNS TABLE (
  proposal_id UUID,
  task_id TEXT,
  agent_count INTEGER,
  synergy_score DECIMAL,
  recommended_leader TEXT,
  safety_approved BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.task_id,
    COALESCE(array_length(cp.agent_ids, 1), 0)::INTEGER,
    cp.synergy_score,
    cp.recommended_leader,
    cp.safety_approved,
    cp.created_at
  FROM coalition_proposals cp
  WHERE cp.workspace_id = p_workspace_id
    AND cp.proposal_status IN ('proposed', 'accepting', 'executing')
  ORDER BY cp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get coalition history and analytics
CREATE OR REPLACE FUNCTION get_coalition_analytics(p_workspace_id UUID)
RETURNS TABLE (
  total_coalitions BIGINT,
  successful_coalitions BIGINT,
  failed_coalitions BIGINT,
  average_synergy NUMERIC,
  most_successful_leader TEXT,
  most_effective_pair TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ch.id)::BIGINT,
    COUNT(CASE WHEN ch.outcome = 'success' THEN 1 END)::BIGINT,
    COUNT(CASE WHEN ch.outcome = 'failure' THEN 1 END)::BIGINT,
    ROUND(AVG(ch.synergy_score)::NUMERIC, 2),
    (SELECT ch2.leader_id FROM coalition_history ch2
     WHERE ch2.workspace_id = p_workspace_id
     GROUP BY ch2.leader_id
     ORDER BY COUNT(*) DESC
     LIMIT 1)::TEXT,
    'N/A'::TEXT -- Placeholder for pair analysis
  FROM coalition_history ch
  WHERE ch.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_active_coalition_proposals TO authenticated;
GRANT EXECUTE ON FUNCTION get_coalition_analytics TO authenticated;

-- Audit Trigger
CREATE OR REPLACE FUNCTION audit_coalition_proposals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_coalition_proposals
BEFORE UPDATE ON coalition_proposals
FOR EACH ROW
EXECUTE FUNCTION audit_coalition_proposals();

CREATE TRIGGER trigger_audit_coalition_history
BEFORE UPDATE ON coalition_history
FOR EACH ROW
EXECUTE FUNCTION audit_coalition_proposals();

-- Comments for documentation
COMMENT ON TABLE coalition_proposals IS
  'Stores coalition formation proposals with synergy scores and safety approvals';

COMMENT ON TABLE coalition_members IS
  'Individual agents within a coalition with role assignments';

COMMENT ON TABLE coalition_roles IS
  'Role assignments for coalition members (leader, planner, executor, validator)';

COMMENT ON TABLE coalition_history IS
  'Historical record of completed coalitions and their outcomes';

COMMENT ON TABLE coalition_patterns IS
  'Detected coalition patterns for learning and optimization';

COMMENT ON COLUMN coalition_proposals.synergy_score IS
  'Coalition synergy: (overlap * 0.35) + (complement * 0.25) + (success * 0.2) + (safety * 0.2)';

COMMENT ON COLUMN coalition_proposals.safety_approved IS
  'True if all agents have risk < 80% and synergy >= 65';
