/**
 * Guardian I07: Incident War-Games & Operator Training Console
 *
 * Defines four tenant-scoped tables for structured incident drills:
 * - guardian_incident_drills: Reusable drill templates
 * - guardian_incident_drill_events: Timeline of simulated events
 * - guardian_incident_drill_runs: Individual drill executions
 * - guardian_incident_drill_responses: Operator actions and responses
 *
 * All tables use RLS to enforce tenant isolation.
 * No writes to real Guardian runtime tables (alerts, incidents, notifications).
 */

-- guardian_incident_drills: Reusable drill templates
CREATE TABLE IF NOT EXISTS guardian_incident_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL, -- 'scenario' | 'regression' | 'playbook_sim' | 'historical_incident'
  source_ref TEXT NOT NULL, -- e.g. guardian_simulation_runs.id or incident id
  difficulty TEXT NOT NULL DEFAULT 'normal', -- 'easy' | 'normal' | 'hard' | 'chaos'
  is_active BOOLEAN NOT NULL DEFAULT true,
  expected_objectives JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(tenant_id, name)
);

-- guardian_incident_drill_events: Chronological event timeline within a drill
CREATE TABLE IF NOT EXISTS guardian_incident_drill_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  drill_id UUID NOT NULL REFERENCES guardian_incident_drills(id) ON DELETE CASCADE,
  sequence_index INTEGER NOT NULL,
  occurred_offset_seconds INTEGER NOT NULL, -- seconds from drill start
  event_type TEXT NOT NULL, -- 'alert' | 'incident' | 'correlation' | 'risk_change' | 'notification' | 'system_message'
  source_ref TEXT, -- e.g. simulated incident/alert id from I02/I03
  severity TEXT, -- 'critical' | 'high' | 'medium' | 'low' | 'info'
  message TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- guardian_incident_drill_runs: Individual drill execution sessions
CREATE TABLE IF NOT EXISTS guardian_incident_drill_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  drill_id UUID NOT NULL REFERENCES guardian_incident_drills(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'cancelled'
  mode TEXT NOT NULL DEFAULT 'guided', -- 'guided' | 'freeform'
  max_duration_seconds INTEGER,
  operator_id TEXT, -- auth user identifier
  team_name TEXT,
  total_events INTEGER NOT NULL DEFAULT 0,
  responded_events INTEGER NOT NULL DEFAULT 0,
  score JSONB, -- aggregated scoring and metrics
  summary JSONB, -- markdown snippets and key learnings
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- guardian_incident_drill_responses: Operator actions per event
CREATE TABLE IF NOT EXISTS guardian_incident_drill_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  drill_run_id UUID NOT NULL REFERENCES guardian_incident_drill_runs(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES guardian_incident_drill_events(id) ON DELETE CASCADE,
  operator_id TEXT, -- auth user identifier
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_text TEXT NOT NULL,
  response_type TEXT NOT NULL, -- 'decision' | 'note' | 'command' | 'classification'
  quality_score INTEGER, -- optional manual or AI scoring 0–100
  latency_ms INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guardian_incident_drills_tenant
  ON guardian_incident_drills(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_incident_drills_active
  ON guardian_incident_drills(tenant_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_guardian_incident_drill_events_drill
  ON guardian_incident_drill_events(tenant_id, drill_id, sequence_index);

CREATE INDEX IF NOT EXISTS idx_guardian_incident_drill_runs_drill
  ON guardian_incident_drill_runs(tenant_id, drill_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_incident_drill_runs_operator
  ON guardian_incident_drill_runs(tenant_id, operator_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_incident_drill_responses_run
  ON guardian_incident_drill_responses(tenant_id, drill_run_id, event_id);

-- RLS Policies: All tables tenant-scoped
ALTER TABLE guardian_incident_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_incident_drill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_incident_drill_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_incident_drill_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON guardian_incident_drills;
CREATE POLICY "tenant_isolation" ON guardian_incident_drills
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "tenant_isolation" ON guardian_incident_drill_events;
CREATE POLICY "tenant_isolation" ON guardian_incident_drill_events
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "tenant_isolation" ON guardian_incident_drill_runs;
CREATE POLICY "tenant_isolation" ON guardian_incident_drill_runs
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS "tenant_isolation" ON guardian_incident_drill_responses;
CREATE POLICY "tenant_isolation" ON guardian_incident_drill_responses
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));
