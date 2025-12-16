-- Decision Circuits Enforcement v1.1.0 Migration
-- Add production health tracking and enforcement audit tables
-- Applied on top of 20251215_decision_circuits_init.sql

-- Enforcement event log (for tracking violations, overrides, etc.)
CREATE TABLE IF NOT EXISTS circuit_enforcement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('violation', 'health_check', 'override')),
  violation_type TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_enforcement_logs_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_enforcement_logs_workspace
  ON circuit_enforcement_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_enforcement_logs_event_type
  ON circuit_enforcement_logs(workspace_id, event_type);
CREATE INDEX IF NOT EXISTS idx_circuit_enforcement_logs_unresolved
  ON circuit_enforcement_logs(workspace_id, resolved);
CREATE INDEX IF NOT EXISTS idx_circuit_enforcement_logs_created
  ON circuit_enforcement_logs(created_at DESC);

-- Health check results (periodic health snapshots)
CREATE TABLE IF NOT EXISTS circuit_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  check_timestamp TIMESTAMPTZ DEFAULT NOW(),
  circuit_success_rate FLOAT DEFAULT 0,
  circuit_avg_latency_ms INT DEFAULT 0,
  circuit_avg_confidence FLOAT DEFAULT 0,
  autocorrection_count_24h INT DEFAULT 0,
  escalation_count_24h INT DEFAULT 0,
  strategy_rotation_count_24h INT DEFAULT 0,
  brand_violation_rate_7d FLOAT DEFAULT 0,
  system_healthy BOOLEAN DEFAULT TRUE,
  health_checks_passed INT DEFAULT 0,
  health_checks_total INT DEFAULT 0,
  check_details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_health_checks_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_health_checks_workspace
  ON circuit_health_checks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_health_checks_timestamp
  ON circuit_health_checks(workspace_id, check_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_circuit_health_checks_healthy
  ON circuit_health_checks(workspace_id, system_healthy);

-- Circuit performance baseline (for tracking performance degradation)
CREATE TABLE IF NOT EXISTS circuit_performance_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_id TEXT NOT NULL,
  baseline_success_rate FLOAT NOT NULL,
  baseline_latency_ms INT NOT NULL,
  baseline_confidence FLOAT NOT NULL,
  established_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_performance_baseline_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  UNIQUE (workspace_id, circuit_id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_performance_baseline_workspace
  ON circuit_performance_baseline(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_performance_baseline_circuit
  ON circuit_performance_baseline(workspace_id, circuit_id);

-- Enable RLS on new enforcement tables
ALTER TABLE circuit_enforcement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_performance_baseline ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "circuit_enforcement_logs_tenant_isolation" ON circuit_enforcement_logs;
CREATE POLICY "circuit_enforcement_logs_tenant_isolation" ON circuit_enforcement_logs
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "circuit_health_checks_tenant_isolation" ON circuit_health_checks;
CREATE POLICY "circuit_health_checks_tenant_isolation" ON circuit_health_checks
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "circuit_performance_baseline_tenant_isolation" ON circuit_performance_baseline;
CREATE POLICY "circuit_performance_baseline_tenant_isolation" ON circuit_performance_baseline
FOR ALL USING (workspace_id = get_current_workspace_id());

-- Comments for documentation
COMMENT ON TABLE circuit_enforcement_logs IS 'Enforcement event log for violations, health checks, and overrides';
COMMENT ON TABLE circuit_health_checks IS 'Periodic health check snapshots for production monitoring';
COMMENT ON TABLE circuit_performance_baseline IS 'Performance baselines for circuit degradation detection';

-- View for enforcement summary
CREATE OR REPLACE VIEW circuit_enforcement_summary AS
SELECT
  workspace_id,
  COUNT(*) FILTER (WHERE event_type = 'violation') as violation_count,
  COUNT(*) FILTER (WHERE event_type = 'health_check') as health_check_count,
  COUNT(*) FILTER (WHERE event_type = 'violation' AND resolved = FALSE) as unresolved_violations,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
  MAX(created_at) as last_event
FROM circuit_enforcement_logs
GROUP BY workspace_id;

-- View for recent health status
CREATE OR REPLACE VIEW circuit_recent_health AS
SELECT DISTINCT ON (workspace_id)
  workspace_id,
  check_timestamp,
  circuit_success_rate,
  circuit_avg_latency_ms,
  circuit_avg_confidence,
  system_healthy,
  health_checks_passed,
  health_checks_total
FROM circuit_health_checks
ORDER BY workspace_id, check_timestamp DESC;
