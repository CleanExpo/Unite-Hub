/**
 * Phase D74: Unite Stability Telemetry Engine
 *
 * Record system events and state snapshots for stability monitoring.
 * CRITICAL: Must not degrade runtime performance - use async writes.
 */

-- ============================================================================
-- TELEMETRY EVENTS (system events and alerts)
-- ============================================================================

DROP TABLE IF EXISTS unite_telemetry_events CASCADE;

CREATE TABLE unite_telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  payload jsonb,
  tenant_id uuid,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_telemetry_events_tenant_severity ON unite_telemetry_events(tenant_id, severity, recorded_at DESC);
CREATE INDEX idx_unite_telemetry_events_component ON unite_telemetry_events(component, recorded_at DESC);
CREATE INDEX idx_unite_telemetry_events_recorded ON unite_telemetry_events(recorded_at DESC);

COMMENT ON TABLE unite_telemetry_events IS 'System telemetry events for stability monitoring';
COMMENT ON COLUMN unite_telemetry_events.component IS 'Component identifier (e.g., "orchestrator", "api", "database")';
COMMENT ON COLUMN unite_telemetry_events.severity IS 'Event severity: debug | info | warning | error | critical';
COMMENT ON COLUMN unite_telemetry_events.payload IS 'Event data: {message, stack_trace, metrics, context}';

-- ============================================================================
-- TELEMETRY SNAPSHOTS (system state snapshots)
-- ============================================================================

DROP TABLE IF EXISTS unite_telemetry_snapshots CASCADE;

CREATE TABLE unite_telemetry_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state jsonb NOT NULL,
  metadata jsonb,
  tenant_id uuid,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_telemetry_snapshots_tenant ON unite_telemetry_snapshots(tenant_id, captured_at DESC);
CREATE INDEX idx_unite_telemetry_snapshots_captured ON unite_telemetry_snapshots(captured_at DESC);

COMMENT ON TABLE unite_telemetry_snapshots IS 'Point-in-time system state snapshots';
COMMENT ON COLUMN unite_telemetry_snapshots.state IS 'System state: {cpu_usage, memory_usage, active_tasks, queue_depth, error_rate}';
COMMENT ON COLUMN unite_telemetry_snapshots.metadata IS 'Snapshot metadata: {trigger, version, environment}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_telemetry_snapshots ENABLE ROW LEVEL SECURITY;

-- Telemetry Events
CREATE POLICY "Users can view telemetry events for their tenant"
  ON unite_telemetry_events FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage telemetry events for their tenant"
  ON unite_telemetry_events FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Telemetry Snapshots
CREATE POLICY "Users can view telemetry snapshots for their tenant"
  ON unite_telemetry_snapshots FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage telemetry snapshots for their tenant"
  ON unite_telemetry_snapshots FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
