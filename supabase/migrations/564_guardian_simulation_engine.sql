-- Guardian Phase I01: Simulation Scenario Registry & Dry-Run Engine
-- Migration: 564
-- Purpose: Add simulation scenarios and dry-run execution tracking (non-destructive testing)
-- Tables: guardian_simulation_scenarios, guardian_simulation_runs

-- ============================================================================
-- TABLE: guardian_simulation_scenarios
-- ============================================================================
-- Stores tenant-scoped simulation test scenarios
-- Uses DSL for defining hypothetical alert/incident patterns
-- Read-only with respect to core Guardian tables (non-destructive)
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'regression' CHECK (category IN ('regression', 'chaos', 'load', 'what_if')),
  scope TEXT NOT NULL DEFAULT 'alerts_only' CHECK (scope IN ('alerts_only', 'incident_flow', 'full_guardian')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  dsl_version INTEGER NOT NULL DEFAULT 1,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  UNIQUE (tenant_id, name)
);

-- ============================================================================
-- TABLE: guardian_simulation_runs
-- ============================================================================
-- Stores dry-run simulation executions and impact estimates
-- Non-destructive: estimates impact without creating real alerts/incidents
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES guardian_simulation_scenarios(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  mode TEXT NOT NULL DEFAULT 'dry_run' CHECK (mode = 'dry_run'),
  effective_window JSONB NOT NULL,
  impact_estimate JSONB,
  error_message TEXT,
  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_simulation_scenarios_tenant
  ON guardian_simulation_scenarios (tenant_id, is_active, category);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_scenarios_created
  ON guardian_simulation_scenarios (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_runs_tenant_started
  ON guardian_simulation_runs (tenant_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_runs_scenario
  ON guardian_simulation_runs (tenant_id, scenario_id, started_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_simulation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rw_guardian_simulation_scenarios ON guardian_simulation_scenarios;
CREATE POLICY tenant_rw_guardian_simulation_scenarios
  ON guardian_simulation_scenarios
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_simulation_scenarios ON guardian_simulation_scenarios;
CREATE POLICY service_all_guardian_simulation_scenarios
  ON guardian_simulation_scenarios
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS tenant_rw_guardian_simulation_runs ON guardian_simulation_runs;
CREATE POLICY tenant_rw_guardian_simulation_runs
  ON guardian_simulation_runs
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_simulation_runs ON guardian_simulation_runs;
CREATE POLICY service_all_guardian_simulation_runs
  ON guardian_simulation_runs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_simulation_scenarios IS 'Simulation test scenarios for Guardian (non-destructive testing)';
COMMENT ON TABLE guardian_simulation_runs IS 'Dry-run simulation executions with impact estimates';
COMMENT ON COLUMN guardian_simulation_scenarios.config IS 'Simulation DSL configuration (JSON) - no PII, rule IDs and patterns only';
COMMENT ON COLUMN guardian_simulation_scenarios.scope IS 'Simulation scope: alerts_only, incident_flow, or full_guardian';
COMMENT ON COLUMN guardian_simulation_runs.mode IS 'Run mode: dry_run only in I01 (future: live, controlled)';
COMMENT ON COLUMN guardian_simulation_runs.impact_estimate IS 'Estimated impact (alerts, incidents, risk) - aggregated metrics only';
