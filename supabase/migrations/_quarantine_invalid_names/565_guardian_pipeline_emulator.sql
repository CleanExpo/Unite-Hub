-- Guardian Phase I02: Alert & Incident Pipeline Emulator
-- Migration: 565
-- Purpose: Add synthetic event generation and pipeline trace logging for simulations
-- Tables: guardian_simulation_events, guardian_simulation_pipeline_traces

-- ============================================================================
-- TABLE: guardian_simulation_events
-- ============================================================================
-- Stores synthetic events generated from simulation scenarios
-- Isolated from core Guardian alert events (non-destructive)
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_simulation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES guardian_simulation_runs(id) ON DELETE CASCADE,
  sequence_index INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  rule_key TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  label TEXT,
  pattern_id TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TABLE: guardian_simulation_pipeline_traces
-- ============================================================================
-- Stores detailed pipeline execution traces for simulation runs
-- Tracks each step: rule eval, correlation, incidents, risk, notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_simulation_pipeline_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES guardian_simulation_runs(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('ingest', 'rule_eval', 'alert_aggregate', 'correlation', 'incident', 'risk', 'notification')),
  step_index INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor TEXT NOT NULL,
  related_event_id UUID REFERENCES guardian_simulation_events(id) ON DELETE SET NULL,
  related_rule_key TEXT,
  related_incident_key TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_guardian_simulation_events_run
  ON guardian_simulation_events (tenant_id, run_id, sequence_index);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_events_generated
  ON guardian_simulation_events (tenant_id, run_id, generated_at);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_pipeline_traces_run_phase
  ON guardian_simulation_pipeline_traces (tenant_id, run_id, phase, step_index);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_pipeline_traces_occurred
  ON guardian_simulation_pipeline_traces (tenant_id, run_id, occurred_at);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_simulation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_simulation_pipeline_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_rw_guardian_simulation_events ON guardian_simulation_events;
CREATE POLICY tenant_rw_guardian_simulation_events
  ON guardian_simulation_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_simulation_events ON guardian_simulation_events;
CREATE POLICY service_all_guardian_simulation_events
  ON guardian_simulation_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS tenant_rw_guardian_simulation_pipeline_traces ON guardian_simulation_pipeline_traces;
CREATE POLICY tenant_rw_guardian_simulation_pipeline_traces
  ON guardian_simulation_pipeline_traces
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS service_all_guardian_simulation_pipeline_traces ON guardian_simulation_pipeline_traces;
CREATE POLICY service_all_guardian_simulation_pipeline_traces
  ON guardian_simulation_pipeline_traces
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_simulation_events IS 'Synthetic events generated from simulation scenarios (isolated from production)';
COMMENT ON TABLE guardian_simulation_pipeline_traces IS 'Pipeline execution traces for simulation runs (step-by-step audit)';
COMMENT ON COLUMN guardian_simulation_events.attributes IS 'Event attributes (no PII, rule IDs and patterns only)';
COMMENT ON COLUMN guardian_simulation_pipeline_traces.phase IS 'Pipeline phase: ingest, rule_eval, alert_aggregate, correlation, incident, risk, notification';
COMMENT ON COLUMN guardian_simulation_pipeline_traces.details IS 'Step details (aggregated metrics, no PII)';
