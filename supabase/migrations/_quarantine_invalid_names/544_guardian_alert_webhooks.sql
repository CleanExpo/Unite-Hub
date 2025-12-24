-- Guardian Phase G39: Webhook Notification Dispatch
-- Migration: 544
-- Purpose: Store per-rule webhook configuration for Guardian alert notifications
-- Tables: guardian_alert_webhooks

-- ============================================================================
-- TABLE: guardian_alert_webhooks
-- ============================================================================
-- Stores webhook configuration for Guardian alert rules
-- When rules with channel='webhook' fire, alerts dispatched to configured URLs
-- Only guardian_admin can configure webhooks
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_alert_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES guardian_alert_rules(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_alert_webhooks_tenant_rule
  ON guardian_alert_webhooks (tenant_id, rule_id, is_active);

CREATE INDEX idx_guardian_alert_webhooks_rule
  ON guardian_alert_webhooks (rule_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_alert_webhooks ENABLE ROW LEVEL SECURITY;

-- SELECT/INSERT/UPDATE: Tenants can manage their own webhooks
CREATE POLICY tenant_rw_guardian_alert_webhooks
  ON guardian_alert_webhooks
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access for webhook dispatch
CREATE POLICY service_all_guardian_alert_webhooks
  ON guardian_alert_webhooks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_alert_webhooks IS 'Webhook configuration for Guardian alert rules (channel=webhook)';
COMMENT ON COLUMN guardian_alert_webhooks.url IS 'Target webhook URL for POST requests';
COMMENT ON COLUMN guardian_alert_webhooks.secret IS 'Optional shared secret sent in X-Guardian-Webhook-Secret header';
COMMENT ON COLUMN guardian_alert_webhooks.is_active IS 'Webhook enabled/disabled flag';
