-- Migration 131: MAOS Deep Agent Orchestration Core
-- Required by Phase 79 - MAOS × Deep Agent Orchestration Core 2.0
-- Unified multi-model, multi-skill execution fabric

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS agent_invocations CASCADE;
DROP TABLE IF EXISTS deep_agent_workflows CASCADE;
DROP TABLE IF EXISTS orchestrator_runs CASCADE;

-- Orchestrator runs table
CREATE TABLE orchestrator_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  initiator_type TEXT NOT NULL,
  initiator_id UUID,
  entrypoint TEXT NOT NULL,
  plan JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_summary TEXT,

  -- Status check
  CONSTRAINT orchestrator_runs_status_check CHECK (
    status IN ('pending', 'planning', 'executing', 'completed', 'failed', 'cancelled')
  ),

  -- Initiator type check
  CONSTRAINT orchestrator_runs_initiator_type_check CHECK (
    initiator_type IN ('user', 'system', 'webhook', 'scheduler', 'voice')
  ),

  -- Foreign key
  CONSTRAINT orchestrator_runs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_org ON orchestrator_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_status ON orchestrator_runs(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_started ON orchestrator_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_initiator ON orchestrator_runs(initiator_type);

-- Enable RLS
ALTER TABLE orchestrator_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY orchestrator_runs_select ON orchestrator_runs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY orchestrator_runs_insert ON orchestrator_runs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY orchestrator_runs_update ON orchestrator_runs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE orchestrator_runs IS 'MAOS orchestrator runs (Phase 79)';

-- Agent invocations table
CREATE TABLE agent_invocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  engine_type TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  token_cost_estimate NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',

  -- Status check
  CONSTRAINT agent_invocations_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'skipped')
  ),

  -- Engine type check
  CONSTRAINT agent_invocations_engine_type_check CHECK (
    engine_type IN ('claude_cli', 'deep_agent', 'gemini_image', 'internal_service')
  ),

  -- Foreign key
  CONSTRAINT agent_invocations_run_fk
    FOREIGN KEY (run_id) REFERENCES orchestrator_runs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_invocations_run ON agent_invocations(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_agent ON agent_invocations(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_engine ON agent_invocations(engine_type);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_status ON agent_invocations(status);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_started ON agent_invocations(started_at DESC);

-- Enable RLS
ALTER TABLE agent_invocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via orchestrator_runs)
CREATE POLICY agent_invocations_select ON agent_invocations
  FOR SELECT TO authenticated
  USING (run_id IN (
    SELECT id FROM orchestrator_runs
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY agent_invocations_insert ON agent_invocations
  FOR INSERT TO authenticated
  WITH CHECK (run_id IN (
    SELECT id FROM orchestrator_runs
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY agent_invocations_update ON agent_invocations
  FOR UPDATE TO authenticated
  USING (run_id IN (
    SELECT id FROM orchestrator_runs
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE agent_invocations IS 'Agent invocation logs (Phase 79)';

-- Deep agent workflows table
CREATE TABLE deep_agent_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  workflow_name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT deep_agent_workflows_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deep_agent_workflows_org ON deep_agent_workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_deep_agent_workflows_name ON deep_agent_workflows(workflow_name);
CREATE INDEX IF NOT EXISTS idx_deep_agent_workflows_last_run ON deep_agent_workflows(last_run_at DESC);

-- Enable RLS
ALTER TABLE deep_agent_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY deep_agent_workflows_select ON deep_agent_workflows
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY deep_agent_workflows_insert ON deep_agent_workflows
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY deep_agent_workflows_update ON deep_agent_workflows
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE deep_agent_workflows IS 'Deep Agent workflow registry (Phase 79)';
