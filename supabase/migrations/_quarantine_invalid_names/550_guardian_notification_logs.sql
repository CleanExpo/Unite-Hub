-- Guardian Phase G49: Notifications V2 - Delivery Logs
-- Migration: 550
-- Purpose: Detailed logging of notification delivery attempts
-- Tables: guardian_notification_logs

-- ============================================================================
-- TABLE: guardian_notification_logs
-- ============================================================================
-- Stores detailed logs of every notification delivery attempt
-- Tracks retries, errors, and delivery outcomes for debugging
-- Complements guardian_notifications with granular delivery tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  rule_id UUID,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'webhook', 'in_app')),
  target TEXT,
  payload JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
  error_message TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_notification_logs_tenant_created
  ON guardian_notification_logs (tenant_id, created_at DESC);

CREATE INDEX idx_guardian_notification_logs_rule
  ON guardian_notification_logs (rule_id, created_at DESC);

CREATE INDEX idx_guardian_notification_logs_status
  ON guardian_notification_logs (tenant_id, status, channel);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_notification_logs ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own notification logs
CREATE POLICY tenant_rw_guardian_notification_logs
  ON guardian_notification_logs
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access for notification dispatch
CREATE POLICY service_all_guardian_notification_logs
  ON guardian_notification_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_notification_logs IS 'Detailed notification delivery logs with retry tracking';
COMMENT ON COLUMN guardian_notification_logs.attempt IS 'Delivery attempt number (1 = first try, 2+ = retries)';
COMMENT ON COLUMN guardian_notification_logs.error_message IS 'Error details if delivery failed';
