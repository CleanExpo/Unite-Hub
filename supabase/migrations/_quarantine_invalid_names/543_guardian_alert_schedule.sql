-- Guardian Phase G37: Automated Alert Scheduling Engine
-- Migration: 543
-- Purpose: Store per-tenant alert scheduling configuration
-- Tables: guardian_alert_schedules

-- ============================================================================
-- TABLE: guardian_alert_schedules
-- ============================================================================
-- Stores per-tenant scheduling configuration for alert evaluation
-- Controls evaluation interval and debounce window to prevent spam
-- Only guardian_admin can configure scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_alert_schedules (
  tenant_id UUID PRIMARY KEY,
  interval_minutes INT NOT NULL DEFAULT 5 CHECK (interval_minutes >= 1 AND interval_minutes <= 1440),
  debounce_minutes INT NOT NULL DEFAULT 10 CHECK (debounce_minutes >= 1 AND debounce_minutes <= 1440),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_alert_schedules_last_run ON guardian_alert_schedules (last_run_at);
CREATE INDEX idx_guardian_alert_schedules_interval ON guardian_alert_schedules (interval_minutes, last_run_at);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_alert_schedules ENABLE ROW LEVEL SECURITY;

-- SELECT: Tenants can read their own schedule
CREATE POLICY tenant_select_guardian_alert_schedules
  ON guardian_alert_schedules
  FOR SELECT
  USING (tenant_id = auth.uid());

-- INSERT/UPDATE: Tenants can manage their own schedule
CREATE POLICY tenant_upsert_guardian_alert_schedules
  ON guardian_alert_schedules
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access for scheduled evaluation
CREATE POLICY service_all_guardian_alert_schedules
  ON guardian_alert_schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_alert_schedules IS 'Per-tenant alert scheduling configuration for automated evaluation';
COMMENT ON COLUMN guardian_alert_schedules.interval_minutes IS 'Evaluation interval in minutes (1-1440, default 5)';
COMMENT ON COLUMN guardian_alert_schedules.debounce_minutes IS 'Debounce window to prevent repeated alerts (1-1440, default 10)';
COMMENT ON COLUMN guardian_alert_schedules.last_run_at IS 'Timestamp of last scheduled evaluation run';
