-- v1_1_21 Phase 1: Hierarchical Multi-Agent Strategy Layer
-- Migration 236: Create strategy system tables with RLS policies

-- Drop existing tables if they exist (for fresh migrations)
DROP TABLE IF EXISTS strategy_patterns CASCADE;
DROP TABLE IF EXISTS strategy_archives CASCADE;
DROP TABLE IF EXISTS strategy_validations CASCADE;
DROP TABLE IF EXISTS strategy_hierarchies CASCADE;
DROP TABLE IF EXISTS strategic_objectives CASCADE;

-- Table 1: Strategic Objectives (the goals/inputs)
CREATE TABLE strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  coalition_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  context TEXT,
  success_criteria TEXT[] DEFAULT '{}',
  constraints TEXT[] DEFAULT '{}',
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Strategy Hierarchies (L1->L2->L3->L4 decomposition)
CREATE TABLE strategy_hierarchies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  coalition_id UUID NOT NULL,
  objective_id UUID NOT NULL REFERENCES strategic_objectives(id) ON DELETE CASCADE,
  l1_strategic_objective JSONB NOT NULL,
  l2_strategic_pillars JSONB NOT NULL,
  l3_strategic_tactics JSONB NOT NULL,
  l4_operational_tasks JSONB NOT NULL,
  hierarchy_score NUMERIC(5,2) NOT NULL CHECK (hierarchy_score >= 0 AND hierarchy_score <= 100) DEFAULT 75,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'validated', 'executing', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Strategy Validations (multi-agent validation results)
CREATE TABLE strategy_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_hierarchy_id UUID NOT NULL REFERENCES strategy_hierarchies(id) ON DELETE CASCADE,
  validation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('approved', 'needs_revision', 'rejected')) DEFAULT 'needs_revision',
  validation_score NUMERIC(5,2) NOT NULL CHECK (validation_score >= 0 AND validation_score <= 100),
  agent_validations JSONB NOT NULL,
  consensus_level NUMERIC(5,2) NOT NULL CHECK (consensus_level >= 0 AND consensus_level <= 100),
  conflicting_views TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  conflicts_detected JSONB DEFAULT '[]'::JSONB,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: Strategy Archives (completed strategies with patterns)
CREATE TABLE strategy_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_hierarchy_id UUID NOT NULL REFERENCES strategy_hierarchies(id) ON DELETE CASCADE,
  outcome_status VARCHAR(20) NOT NULL CHECK (outcome_status IN ('successful', 'partial_success', 'failed')) DEFAULT 'partial_success',
  completion_rate NUMERIC(5,2) NOT NULL CHECK (completion_rate >= 0 AND completion_rate <= 100),
  time_efficiency NUMERIC(5,2) NOT NULL CHECK (time_efficiency >= 0 AND time_efficiency <= 120),
  cost_efficiency NUMERIC(5,2) NOT NULL CHECK (cost_efficiency >= 0 AND cost_efficiency <= 100),
  detected_patterns VARCHAR(50)[] DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  lessons_learned TEXT[] DEFAULT '{}',
  actual_metrics JSONB NOT NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 5: Strategy Patterns (pattern library for learning)
CREATE TABLE strategy_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pattern_name VARCHAR(100) NOT NULL,
  description TEXT,
  pattern_type VARCHAR(50) NOT NULL,
  frequency INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL CHECK (success_rate >= 0 AND success_rate <= 100),
  efficacy NUMERIC(5,2) NOT NULL CHECK (efficacy >= 0 AND efficacy <= 100),
  related_strategies UUID[] DEFAULT '{}',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, pattern_name, pattern_type)
);

-- Create indexes for performance
CREATE INDEX idx_strategic_objectives_workspace ON strategic_objectives(workspace_id);
CREATE INDEX idx_strategic_objectives_coalition ON strategic_objectives(coalition_id);
CREATE INDEX idx_strategic_objectives_status ON strategic_objectives(status);

CREATE INDEX idx_strategy_hierarchies_workspace ON strategy_hierarchies(workspace_id);
CREATE INDEX idx_strategy_hierarchies_objective ON strategy_hierarchies(objective_id);
CREATE INDEX idx_strategy_hierarchies_coalition ON strategy_hierarchies(coalition_id);
CREATE INDEX idx_strategy_hierarchies_status ON strategy_hierarchies(status);

CREATE INDEX idx_strategy_validations_workspace ON strategy_validations(workspace_id);
CREATE INDEX idx_strategy_validations_hierarchy ON strategy_validations(strategy_hierarchy_id);
CREATE INDEX idx_strategy_validations_status ON strategy_validations(overall_status);

CREATE INDEX idx_strategy_archives_workspace ON strategy_archives(workspace_id);
CREATE INDEX idx_strategy_archives_hierarchy ON strategy_archives(strategy_hierarchy_id);
CREATE INDEX idx_strategy_archives_outcome ON strategy_archives(outcome_status);

CREATE INDEX idx_strategy_patterns_workspace ON strategy_patterns(workspace_id);
CREATE INDEX idx_strategy_patterns_type ON strategy_patterns(pattern_type);

-- Helper function to get active strategy hierarchies for a coalition
CREATE OR REPLACE FUNCTION get_active_strategies(p_coalition_id UUID)
RETURNS TABLE (
  id UUID,
  objective_id UUID,
  hierarchy_score NUMERIC,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT sh.id, sh.objective_id, sh.hierarchy_score, sh.status, sh.created_at
  FROM strategy_hierarchies sh
  WHERE sh.coalition_id = p_coalition_id
    AND sh.status IN ('validated', 'executing')
  ORDER BY sh.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get strategy analytics
CREATE OR REPLACE FUNCTION get_strategy_analytics(p_workspace_id UUID)
RETURNS TABLE (
  total_strategies INTEGER,
  completed_strategies INTEGER,
  successful_completion_rate NUMERIC,
  avg_hierarchy_score NUMERIC,
  avg_execution_time NUMERIC,
  most_common_pattern VARCHAR
) AS $$
DECLARE
  v_total INTEGER;
  v_successful INTEGER;
  v_pattern VARCHAR;
BEGIN
  SELECT COUNT(*) INTO v_total FROM strategy_hierarchies WHERE workspace_id = p_workspace_id;

  SELECT COUNT(*) INTO v_successful
  FROM strategy_archives
  WHERE workspace_id = p_workspace_id AND outcome_status = 'successful';

  WITH pattern_freq AS (
    SELECT unnest(detected_patterns) as pattern, COUNT(*) as freq
    FROM strategy_archives
    WHERE workspace_id = p_workspace_id
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 1
  )
  SELECT COALESCE(pattern, 'none') INTO v_pattern FROM pattern_freq;

  RETURN QUERY
  SELECT
    v_total,
    v_successful,
    CASE WHEN v_total > 0 THEN (v_successful::NUMERIC / v_total * 100) ELSE 0 END,
    (SELECT AVG(hierarchy_score) FROM strategy_hierarchies WHERE workspace_id = p_workspace_id),
    (SELECT AVG((actual_metrics->>'totalTime')::NUMERIC) / 60 FROM strategy_archives WHERE workspace_id = p_workspace_id),
    v_pattern;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_hierarchies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies: strategic_objectives
CREATE POLICY strategic_objectives_founder_select ON strategic_objectives
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategic_objectives_founder_insert ON strategic_objectives
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategic_objectives_founder_update ON strategic_objectives
  FOR UPDATE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategic_objectives_founder_delete ON strategic_objectives
  FOR DELETE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policies: strategy_hierarchies
CREATE POLICY strategy_hierarchies_founder_select ON strategy_hierarchies
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategy_hierarchies_founder_insert ON strategy_hierarchies
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategy_hierarchies_founder_update ON strategy_hierarchies
  FOR UPDATE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policies: strategy_validations
CREATE POLICY strategy_validations_founder_select ON strategy_validations
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategy_validations_founder_insert ON strategy_validations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategy_validations_founder_update ON strategy_validations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policies: strategy_archives
CREATE POLICY strategy_archives_founder_select ON strategy_archives
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategy_archives_founder_insert ON strategy_archives
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policies: strategy_patterns
CREATE POLICY strategy_patterns_founder_select ON strategy_patterns
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategy_patterns_founder_insert ON strategy_patterns
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY strategy_patterns_founder_update ON strategy_patterns
  FOR UPDATE USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON w.org_id = uo.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Audit triggers for automatic timestamp updates
CREATE TRIGGER strategic_objectives_updated_trigger
BEFORE UPDATE ON strategic_objectives
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER strategy_hierarchies_updated_trigger
BEFORE UPDATE ON strategy_hierarchies
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER strategy_validations_updated_trigger
BEFORE UPDATE ON strategy_validations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER strategy_archives_updated_trigger
BEFORE UPDATE ON strategy_archives
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER strategy_patterns_updated_trigger
BEFORE UPDATE ON strategy_patterns
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
