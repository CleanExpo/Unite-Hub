-- Phase 7: Optimization Layer
-- Stores reward signals, optimization runs, tuning profiles, strategy playbooks, and founder actions

-- Agent reward tracking
CREATE TABLE IF NOT EXISTS agent_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  agent TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN (
    'email_performance', 'research_quality', 'content_effectiveness',
    'scheduling_efficiency', 'analysis_accuracy', 'coordination_success'
  )),
  value NUMERIC NOT NULL,
  reward NUMERIC NOT NULL CHECK (reward >= 0 AND reward <= 1),
  context JSONB,
  CONSTRAINT reward_range CHECK (reward >= 0 AND reward <= 1)
);

-- Optimization run history
CREATE TABLE IF NOT EXISTS optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  suggestions JSONB NOT NULL,
  changes JSONB NOT NULL,
  auto_tuner_applied BOOLEAN DEFAULT FALSE
);

-- Auto-tuning change history
CREATE TABLE IF NOT EXISTS tuning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  agent TEXT NOT NULL,
  param TEXT NOT NULL,
  value JSONB,
  reason TEXT NOT NULL,
  auto_applied BOOLEAN NOT NULL DEFAULT FALSE,
  requires_founder_approval BOOLEAN NOT NULL DEFAULT FALSE,
  founder_decision TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_tuning_change UNIQUE (agent, param, created_at)
);

-- Strategy playbooks
CREATE TABLE IF NOT EXISTS strategy_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  workflows JSONB NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  agents_involved TEXT[] NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived'))
);

-- Founder optimization actions (approval/rejection decisions)
CREATE TABLE IF NOT EXISTS founder_optimization_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'modified', 'implemented')),
  details JSONB,
  target_id UUID,
  target_type TEXT,
  reason TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT founder_action_audit CHECK (decided_at IS NOT NULL)
);

-- Memory consolidation events
CREATE TABLE IF NOT EXISTS memory_consolidation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source_scope TEXT NOT NULL CHECK (source_scope IN ('short_term', 'working', 'long_term')),
  topic TEXT NOT NULL,
  items_consolidated INTEGER NOT NULL,
  consolidated_payload JSONB NOT NULL,
  summary_hint TEXT
);

-- Workflow execution queue and history
CREATE TABLE IF NOT EXISTS workflow_executions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  play_id UUID,
  objective TEXT NOT NULL,
  workflow_template TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  agents JSONB NOT NULL,
  estimated_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  outcome JSONB
);

-- Enable RLS
ALTER TABLE agent_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_optimization_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_consolidation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated read)
CREATE POLICY "Allow authenticated read rewards" ON agent_rewards
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read opt_runs" ON optimization_runs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read tuning" ON tuning_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read plays" ON strategy_playbooks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read founder_actions" ON founder_optimization_actions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read consolidation" ON memory_consolidation_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read workflow_v2" ON workflow_executions_v2
  FOR SELECT USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_rewards_agent_dim ON agent_rewards(agent, dimension);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_created ON agent_rewards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_rewards_reward ON agent_rewards(reward DESC);

CREATE INDEX IF NOT EXISTS idx_opt_runs_created ON optimization_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opt_runs_auto_tuner ON optimization_runs(auto_tuner_applied);

CREATE INDEX IF NOT EXISTS idx_tuning_agent_param ON tuning_profiles(agent, param);
CREATE INDEX IF NOT EXISTS idx_tuning_created ON tuning_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tuning_approval ON tuning_profiles(requires_founder_approval);
CREATE INDEX IF NOT EXISTS idx_tuning_auto_applied ON tuning_profiles(auto_applied);

CREATE INDEX IF NOT EXISTS idx_strategy_theme ON strategy_playbooks(theme);
CREATE INDEX IF NOT EXISTS idx_strategy_priority ON strategy_playbooks(priority);
CREATE INDEX IF NOT EXISTS idx_strategy_status ON strategy_playbooks(status);
CREATE INDEX IF NOT EXISTS idx_strategy_agents ON strategy_playbooks USING GIN(agents_involved);

CREATE INDEX IF NOT EXISTS idx_founder_actions_type ON founder_optimization_actions(action);
CREATE INDEX IF NOT EXISTS idx_founder_actions_target ON founder_optimization_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_founder_actions_created ON founder_optimization_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consolidation_topic ON memory_consolidation_log(topic);
CREATE INDEX IF NOT EXISTS idx_consolidation_scope ON memory_consolidation_log(source_scope);
CREATE INDEX IF NOT EXISTS idx_consolidation_created ON memory_consolidation_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_v2_status ON workflow_executions_v2(status);
CREATE INDEX IF NOT EXISTS idx_workflow_v2_priority ON workflow_executions_v2(priority);
CREATE INDEX IF NOT EXISTS idx_workflow_v2_template ON workflow_executions_v2(workflow_template);
CREATE INDEX IF NOT EXISTS idx_workflow_v2_created ON workflow_executions_v2(created_at DESC);

-- Comments
DO $$
BEGIN
  COMMENT ON TABLE agent_rewards IS 'Normalized reward signals (0–1) for each agent dimension, used for learning and optimization.';
  COMMENT ON TABLE optimization_runs IS 'History of optimization run execution with suggestions and applied changes.';
  COMMENT ON TABLE tuning_profiles IS 'Auto-tuning changes applied to agents, with approval status and founder decisions.';
  COMMENT ON TABLE strategy_playbooks IS 'High-level strategy plays synthesized from global insights.';
  COMMENT ON TABLE founder_optimization_actions IS 'Audit trail of founder approval/rejection decisions on optimizations.';
  COMMENT ON TABLE memory_consolidation_log IS 'Record of memory consolidation events from working to long-term storage.';
  COMMENT ON TABLE workflow_executions_v2 IS 'Queue and history of routed workflows from strategy plays.';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
