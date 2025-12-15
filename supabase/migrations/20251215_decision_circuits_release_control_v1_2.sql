-- Decision Circuits Release Control v1.2.0 Migration
-- Autonomous canary rollout with continuous validation and automatic rollback
-- Applied on top of previous migrations

-- Circuit versions table (immutable version history)
CREATE TABLE IF NOT EXISTS circuit_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  version_id TEXT UNIQUE NOT NULL,
  circuit_id TEXT NOT NULL,
  version_number INT NOT NULL,
  released_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  is_canary BOOLEAN DEFAULT FALSE,
  canary_phase TEXT,
  traffic_percent INT DEFAULT 0,
  health_score FLOAT DEFAULT 0,
  rollback_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_versions_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT valid_canary_phase
    CHECK (
      canary_phase IS NULL
      OR canary_phase IN ('canary_10', 'canary_50', 'full_release')
    ),
  CONSTRAINT valid_traffic_percent
    CHECK (traffic_percent >= 0 AND traffic_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_circuit_versions_workspace
  ON circuit_versions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_versions_circuit
  ON circuit_versions(workspace_id, circuit_id);
CREATE INDEX IF NOT EXISTS idx_circuit_versions_active
  ON circuit_versions(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_circuit_versions_canary
  ON circuit_versions(workspace_id, is_canary);
CREATE INDEX IF NOT EXISTS idx_circuit_versions_released
  ON circuit_versions(released_at DESC);

-- Release state tracking
CREATE TABLE IF NOT EXISTS circuit_release_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL DEFAULT 'canary_10',
  current_version_id TEXT NOT NULL,
  previous_version_id TEXT,
  phase_started_at TIMESTAMPTZ NOT NULL,
  min_phase_duration_hours INT DEFAULT 24,
  ready_for_next_phase BOOLEAN DEFAULT FALSE,
  health_checks_passing BOOLEAN DEFAULT FALSE,
  can_rollback BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_release_state_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT valid_phase
    CHECK (
      current_phase IN ('canary_10', 'canary_50', 'full_release')
    )
);

CREATE INDEX IF NOT EXISTS idx_circuit_release_state_workspace
  ON circuit_release_state(workspace_id);

-- Release events (audit trail)
CREATE TABLE IF NOT EXISTS circuit_release_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  version_id TEXT NOT NULL,
  phase TEXT,
  traffic_percent INT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_release_events_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT valid_event_type
    CHECK (
      event_type IN (
        'canary_started',
        'canary_progressed',
        'full_released',
        'automatic_rollback',
        'manual_rollback'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_circuit_release_events_workspace
  ON circuit_release_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_release_events_type
  ON circuit_release_events(workspace_id, event_type);
CREATE INDEX IF NOT EXISTS idx_circuit_release_events_created
  ON circuit_release_events(created_at DESC);

-- Rollback events (detailed rollback log)
CREATE TABLE IF NOT EXISTS circuit_rollback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rollback_id TEXT UNIQUE NOT NULL,
  from_version_id TEXT NOT NULL,
  to_version_id TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL,
  reverted_at TIMESTAMPTZ,
  success BOOLEAN DEFAULT FALSE,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_rollback_events_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_rollback_events_workspace
  ON circuit_rollback_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_rollback_events_rollback_id
  ON circuit_rollback_events(rollback_id);
CREATE INDEX IF NOT EXISTS idx_circuit_rollback_events_executed
  ON circuit_rollback_events(executed_at DESC);

-- Enable RLS on all new tables
ALTER TABLE circuit_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_release_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_release_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_rollback_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "circuit_versions_tenant_isolation" ON circuit_versions;
CREATE POLICY "circuit_versions_tenant_isolation" ON circuit_versions
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "circuit_release_state_tenant_isolation" ON circuit_release_state;
CREATE POLICY "circuit_release_state_tenant_isolation" ON circuit_release_state
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "circuit_release_events_tenant_isolation" ON circuit_release_events;
CREATE POLICY "circuit_release_events_tenant_isolation" ON circuit_release_events
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "circuit_rollback_events_tenant_isolation" ON circuit_rollback_events;
CREATE POLICY "circuit_rollback_events_tenant_isolation" ON circuit_rollback_events
FOR ALL USING (workspace_id = get_current_workspace_id());

-- View for release timeline
CREATE OR REPLACE VIEW circuit_release_timeline AS
SELECT
  workspace_id,
  event_type,
  phase,
  traffic_percent,
  created_at,
  EXTRACT(
    EPOCH
    FROM (
      LEAD(created_at) OVER (
        PARTITION BY workspace_id
        ORDER BY created_at DESC
      ) - created_at
    )
  ) / 3600 as duration_hours
FROM circuit_release_events
ORDER BY workspace_id, created_at DESC;

-- View for active rollback status
CREATE OR REPLACE VIEW circuit_active_rollbacks AS
SELECT
  workspace_id,
  rollback_id,
  from_version_id,
  to_version_id,
  trigger,
  success,
  executed_at,
  CASE
    WHEN reverted_at IS NOT NULL THEN 'reverted'
    WHEN success THEN 'active'
    ELSE 'failed'
  END as status
FROM circuit_rollback_events
WHERE executed_at > NOW() - INTERVAL '30 days'
ORDER BY executed_at DESC;

-- Comments
COMMENT ON TABLE circuit_versions IS 'Immutable version history for circuits';
COMMENT ON TABLE circuit_release_state IS 'Current canary phase and version state';
COMMENT ON TABLE circuit_release_events IS 'Audit trail of all release events';
COMMENT ON TABLE circuit_rollback_events IS 'Detailed log of rollback events';
