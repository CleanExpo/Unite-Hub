-- Guardian Phase G42: Slack Integration
-- Migration: 546
-- Purpose: Store per-tenant Slack webhook configuration
-- Tables: guardian_slack_config

-- ============================================================================
-- TABLE: guardian_slack_config
-- ============================================================================
-- Stores Slack webhook configuration for Guardian alert notifications
-- One configuration per tenant (webhook URL + optional channel override)
-- Only guardian_admin can configure Slack integration
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_slack_config (
  tenant_id UUID PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  channel TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_slack_config ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own Slack configuration
CREATE POLICY tenant_rw_guardian_slack_config
  ON guardian_slack_config
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access for Slack notification dispatch
CREATE POLICY service_all_guardian_slack_config
  ON guardian_slack_config
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_slack_config IS 'Per-tenant Slack webhook configuration for Guardian alerts';
COMMENT ON COLUMN guardian_slack_config.webhook_url IS 'Slack incoming webhook URL (https://hooks.slack.com/services/...)';
COMMENT ON COLUMN guardian_slack_config.channel IS 'Optional channel override (default: webhook default channel)';
COMMENT ON COLUMN guardian_slack_config.is_active IS 'Enable/disable Slack notifications without deleting config';
