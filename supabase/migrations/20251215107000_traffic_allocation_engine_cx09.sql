-- Traffic Allocation Engine (Phase 3) v1.0 Migration
-- Guarded control layer for applying CX09 A/B testing outcomes to live workflows

-- Traffic allocation state (current allocation for each variant)
CREATE TABLE IF NOT EXISTS traffic_allocation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ab_test_id UUID NOT NULL REFERENCES circuit_ab_tests(id) ON DELETE CASCADE,

  -- Variant allocation
  variant_id TEXT NOT NULL,
  allocation_percent INT NOT NULL CHECK (allocation_percent >= 0 AND allocation_percent <= 100),

  -- State tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  applied_at TIMESTAMPTZ NOT NULL,
  applied_from_evaluation_id UUID,

  -- Rollback tracking
  can_rollback BOOLEAN NOT NULL DEFAULT true,
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT traffic_allocation_state_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT traffic_allocation_state_test_fk
    FOREIGN KEY (ab_test_id) REFERENCES circuit_ab_tests(id),
  CONSTRAINT traffic_allocation_state_variant_unique
    UNIQUE(ab_test_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_traffic_allocation_state_workspace
  ON traffic_allocation_state(workspace_id);
CREATE INDEX IF NOT EXISTS idx_traffic_allocation_state_ab_test
  ON traffic_allocation_state(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_traffic_allocation_state_active
  ON traffic_allocation_state(is_active, workspace_id);

-- Traffic allocation events (audit trail)
CREATE TABLE IF NOT EXISTS traffic_allocation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ab_test_id UUID NOT NULL REFERENCES circuit_ab_tests(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('allocation_applied', 'allocation_rolled_back', 'health_check_passed', 'health_check_failed')),
  variant_id TEXT,
  allocation_percent INT,

  -- Evaluation context
  triggered_by_evaluation_id UUID REFERENCES circuit_ab_test_winners(id),
  confidence_score FLOAT,
  performance_delta FLOAT,

  -- Health status
  health_metrics JSONB,  -- {success_rate, error_rate, retry_rate}
  rollback_reason TEXT,

  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT traffic_allocation_events_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT traffic_allocation_events_test_fk
    FOREIGN KEY (ab_test_id) REFERENCES circuit_ab_tests(id)
);

CREATE INDEX IF NOT EXISTS idx_traffic_allocation_events_workspace
  ON traffic_allocation_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_traffic_allocation_events_ab_test
  ON traffic_allocation_events(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_traffic_allocation_events_type
  ON traffic_allocation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_traffic_allocation_events_triggered_at
  ON traffic_allocation_events(triggered_at DESC);

-- Rate limiter state (track allocation frequency)
CREATE TABLE IF NOT EXISTS traffic_allocation_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Rate limiting
  allocations_today INT NOT NULL DEFAULT 0,
  last_allocation_at TIMESTAMPTZ,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT traffic_allocation_limits_workspace_unique
    UNIQUE(workspace_id),
  CONSTRAINT traffic_allocation_limits_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_traffic_allocation_limits_workspace
  ON traffic_allocation_limits(workspace_id);

-- Enable Row Level Security
ALTER TABLE traffic_allocation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_allocation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_allocation_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
DROP POLICY IF EXISTS "traffic_allocation_state_tenant_isolation" ON traffic_allocation_state;
CREATE POLICY "traffic_allocation_state_tenant_isolation" ON traffic_allocation_state
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "traffic_allocation_events_tenant_isolation" ON traffic_allocation_events;
CREATE POLICY "traffic_allocation_events_tenant_isolation" ON traffic_allocation_events
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "traffic_allocation_limits_tenant_isolation" ON traffic_allocation_limits;
CREATE POLICY "traffic_allocation_limits_tenant_isolation" ON traffic_allocation_limits
FOR ALL USING (workspace_id = get_current_workspace_id());

-- View for current allocation state (read-only)
CREATE OR REPLACE VIEW traffic_allocation_current AS
SELECT
  workspace_id,
  ab_test_id,
  variant_id,
  allocation_percent,
  is_active,
  applied_at,
  rolled_back_at
FROM traffic_allocation_state
WHERE is_active = true;

-- View for allocation history
CREATE OR REPLACE VIEW traffic_allocation_history AS
SELECT
  e.workspace_id,
  e.ab_test_id,
  e.event_type,
  e.variant_id,
  e.allocation_percent,
  e.confidence_score,
  e.performance_delta,
  e.health_metrics,
  e.rollback_reason,
  e.triggered_at,
  e.recorded_at
FROM traffic_allocation_events e
ORDER BY e.triggered_at DESC;

-- Comments
COMMENT ON TABLE traffic_allocation_state IS 'Current traffic allocation state for each A/B test variant';
COMMENT ON TABLE traffic_allocation_events IS 'Audit trail of all traffic allocation changes and health checks';
COMMENT ON TABLE traffic_allocation_limits IS 'Rate limiting state to prevent too-frequent allocation changes';
COMMENT ON VIEW traffic_allocation_current IS 'Current active traffic allocation (RLS enforced)';
COMMENT ON VIEW traffic_allocation_history IS 'Complete history of allocation changes and rollbacks (RLS enforced)';
