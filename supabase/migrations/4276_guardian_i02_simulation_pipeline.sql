/**
 * Guardian I02: Alert & Incident Pipeline Emulator
 * Migration: Simulation Events and Pipeline Traces
 *
 * Creates tenant-scoped tables for:
 * - guardian_simulation_events: Synthetic events generated from scenarios
 * - guardian_simulation_pipeline_traces: Detailed trace log of pipeline simulation
 *
 * These tables remain isolated from production G-series tables.
 * RLS enforces tenant isolation.
 */

-- Ensure guardian_simulation_runs exists (from I01)
-- This migration assumes I01 has already created it

-- Create guardian_simulation_events table
CREATE TABLE IF NOT EXISTS guardian_simulation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES guardian_simulation_runs(id) ON DELETE CASCADE,

  -- Event ordering and metadata
  sequence_index INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,

  -- Event classification
  rule_key TEXT NOT NULL,
  severity TEXT NOT NULL, -- e.g., 'low', 'medium', 'high', 'critical'
  label TEXT,
  pattern_id TEXT, -- Optional reference to config pattern

  -- High-level attributes only (no raw payloads, PII, or tokens)
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_events_tenant_run_seq
  ON guardian_simulation_events(tenant_id, run_id, sequence_index);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_events_tenant_run_time
  ON guardian_simulation_events(tenant_id, run_id, generated_at);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_events_rule
  ON guardian_simulation_events(tenant_id, rule_key);

-- Create guardian_simulation_pipeline_traces table
CREATE TABLE IF NOT EXISTS guardian_simulation_pipeline_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_id UUID NOT NULL REFERENCES guardian_simulation_runs(id) ON DELETE CASCADE,

  -- Pipeline phase
  phase TEXT NOT NULL, -- e.g., 'ingest', 'rule_eval', 'alert_aggregate', 'correlation', 'incident', 'risk', 'notification'
  step_index INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,

  -- Actor and relationship info
  actor TEXT NOT NULL, -- e.g., 'engine', 'correlator', 'risk_engine', 'notifier'
  related_event_id UUID REFERENCES guardian_simulation_events(id) ON DELETE SET NULL,
  related_rule_key TEXT,
  related_incident_key TEXT,

  -- Severity and message
  severity TEXT,
  message TEXT NOT NULL,

  -- Detailed information
  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_pipeline_traces_tenant_run_phase
  ON guardian_simulation_pipeline_traces(tenant_id, run_id, phase, step_index);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_pipeline_traces_tenant_run_time
  ON guardian_simulation_pipeline_traces(tenant_id, run_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_guardian_simulation_pipeline_traces_event
  ON guardian_simulation_pipeline_traces(related_event_id);

-- Enable Row Level Security
ALTER TABLE guardian_simulation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_simulation_pipeline_traces ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their workspace's simulation events
DROP POLICY IF EXISTS "tenant_isolation_events" ON guardian_simulation_events;
CREATE POLICY "tenant_isolation_events" ON guardian_simulation_events
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()));

-- RLS Policy: Users can only see their workspace's simulation traces
DROP POLICY IF EXISTS "tenant_isolation_traces" ON guardian_simulation_pipeline_traces;

CREATE POLICY "tenant_isolation_traces" ON guardian_simulation_pipeline_traces
FOR ALL
USING (tenant_id IN (SELECT get_user_workspaces()));

-- Comment on tables for documentation
COMMENT ON TABLE guardian_simulation_events IS
'Synthetic events generated from Guardian simulation scenarios. High-level attributes only; no raw payloads or PII.';

COMMENT ON TABLE guardian_simulation_pipeline_traces IS
'Detailed trace log of Guardian pipeline simulation: rule evaluation, alert aggregation, correlation, incident creation, risk scoring, and notification steps.';

COMMENT ON COLUMN guardian_simulation_events.attributes IS
'High-level metadata: rule refs, severities, counts, synthetic identifiers. Must not contain raw event payloads, tokens, or PII.';

COMMENT ON COLUMN guardian_simulation_pipeline_traces.details IS
'Step details: ruleKey, severity, counts, related entity references. Must not expose production data.';
