-- Guardian Phase G40: Notifications Core
-- Migration: 545
-- Purpose: Core notification tracking for Guardian alerts
-- Tables: guardian_notifications

-- ============================================================================
-- TABLE: guardian_notifications
-- ============================================================================
-- Tracks all Guardian notification attempts (email, Slack, webhook, in-app)
-- Records delivery status and errors for observability
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('alert', 'incident', 'digest')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'slack', 'webhook', 'in_app')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  target TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_notifications_tenant_created
  ON guardian_notifications (tenant_id, created_at DESC);

CREATE INDEX idx_guardian_notifications_status
  ON guardian_notifications (tenant_id, status, channel);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_notifications ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own notifications
CREATE POLICY tenant_rw_guardian_notifications
  ON guardian_notifications
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access for notification dispatch
CREATE POLICY service_all_guardian_notifications
  ON guardian_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_notifications IS 'Guardian notification tracking (email, Slack, webhook, in-app)';
COMMENT ON COLUMN guardian_notifications.type IS 'Notification type: alert, incident, or digest';
COMMENT ON COLUMN guardian_notifications.channel IS 'Delivery channel: email, slack, webhook, or in_app';
COMMENT ON COLUMN guardian_notifications.status IS 'Delivery status: pending, sent, or failed';
COMMENT ON COLUMN guardian_notifications.context IS 'Notification context (rule ID, reason, actor, etc.)';
