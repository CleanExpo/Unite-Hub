-- Migration 583: Guardian Scenario Simulator
-- Purpose: Scenario definitions and logged scenario runs for risk simulation

-- Table 1: Scenario Definitions
CREATE TABLE IF NOT EXISTS guardian_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('outage','schema_drift','agent_failure','traffic_spike','security','compliance','custom')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guardian_scenarios_tenant_time
  ON guardian_scenarios (tenant_id, created_at DESC);

CREATE INDEX idx_guardian_scenarios_category
  ON guardian_scenarios (tenant_id, category) WHERE is_active = TRUE;

ALTER TABLE guardian_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_guardian_scenarios ON guardian_scenarios
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_scenarios IS 'Guardian G28: Scenario definitions for risk simulation';

-- Table 2: Scenario Runs
CREATE TABLE IF NOT EXISTS guardian_scenario_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES guardian_scenarios(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed','cancelled')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  summary TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guardian_scenario_runs_tenant_scenario_time
  ON guardian_scenario_runs (tenant_id, scenario_id, created_at DESC);

CREATE INDEX idx_guardian_scenario_runs_status
  ON guardian_scenario_runs (tenant_id, status) WHERE status IN ('running', 'pending');

ALTER TABLE guardian_scenario_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_guardian_scenario_runs ON guardian_scenario_runs
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_scenario_runs IS 'Guardian G28: Logged scenario execution runs';

-- Table 3: Scenario Run Events
CREATE TABLE IF NOT EXISTS guardian_scenario_run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES guardian_scenario_runs(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  phase TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info','warn','error')),
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guardian_scenario_run_events_tenant_run_step
  ON guardian_scenario_run_events (tenant_id, run_id, step_index ASC);

CREATE INDEX idx_guardian_scenario_run_events_level
  ON guardian_scenario_run_events (tenant_id, run_id, level) WHERE level IN ('error', 'warn');

ALTER TABLE guardian_scenario_run_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_guardian_scenario_run_events ON guardian_scenario_run_events
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_scenario_run_events IS 'Guardian G28: Step-by-step events for scenario runs';
