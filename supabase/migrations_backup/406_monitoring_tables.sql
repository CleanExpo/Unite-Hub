-- Migration 406: Monitoring & Alerting Tables for Phase 7 Part 2
-- Creates tables for usage analytics, alerts, notifications, and health checks

-- ====================
-- Usage Analytics Tables
-- ====================

-- Usage metrics table
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('command', 'api_call', 'credential_op', 'tenant_op', 'error')),
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for usage_metrics
CREATE INDEX IF NOT EXISTS idx_usage_metrics_workspace ON usage_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_name ON usage_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_created ON usage_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_workspace_type ON usage_metrics(workspace_id, metric_type);

-- ====================
-- Alerting Tables
-- ====================

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  service TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  type TEXT NOT NULL CHECK (type IN ('expiring_30d', 'expiring_7d', 'expiring_1d', 'expired')),
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  days_until_expiry INTEGER,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_workspace ON alerts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

-- Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('expiring_30d', 'expiring_7d', 'expiring_1d', 'expired')),
  channels TEXT[] NOT NULL DEFAULT '{}',
  email_recipients TEXT[] DEFAULT '{}',
  slack_webhook_url TEXT,
  custom_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alert_rules
CREATE INDEX IF NOT EXISTS idx_alert_rules_workspace ON alert_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(alert_type);

-- ====================
-- Notification Tables
-- ====================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credential_expiry', 'health_alert', 'usage_threshold', 'system_error')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  channels TEXT[] NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_severity ON notifications(severity);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ====================
-- Health Checks Tables
-- ====================

-- Health check results table
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  message TEXT NOT NULL,
  response_time INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for health_checks
CREATE INDEX IF NOT EXISTS idx_health_checks_workspace ON health_checks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_health_checks_name ON health_checks(check_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_created ON health_checks(created_at);

-- ====================
-- Tenant Templates Table
-- ====================

-- Tenant templates table (for custom templates)
CREATE TABLE IF NOT EXISTS tenant_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shopify', 'google-merchant', 'mixed')),
  market TEXT NOT NULL,
  region TEXT NOT NULL,
  default_metadata JSONB DEFAULT '{}'::jsonb,
  required_fields TEXT[] DEFAULT '{}',
  optional_fields TEXT[] DEFAULT '{}',
  setup_steps TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tenant_templates
CREATE INDEX IF NOT EXISTS idx_tenant_templates_workspace ON tenant_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tenant_templates_type ON tenant_templates(type);
CREATE INDEX IF NOT EXISTS idx_tenant_templates_created ON tenant_templates(created_at);

-- ====================
-- Triggers
-- ====================

-- Auto-update updated_at for alert_rules
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_alert_rules_updated_at ON alert_rules;
CREATE TRIGGER trigger_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

-- Auto-update updated_at for tenant_templates
CREATE OR REPLACE FUNCTION update_tenant_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenant_templates_updated_at ON tenant_templates;
CREATE TRIGGER trigger_tenant_templates_updated_at
  BEFORE UPDATE ON tenant_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_templates_updated_at();

-- ====================
-- RLS Policies
-- ====================

-- Enable RLS on all tables
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_templates ENABLE ROW LEVEL SECURITY;

-- Usage metrics policies
CREATE POLICY usage_metrics_select ON usage_metrics
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY usage_metrics_insert ON usage_metrics
  FOR INSERT WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Alerts policies
CREATE POLICY alerts_select ON alerts
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY alerts_update ON alerts
  FOR UPDATE USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Alert rules policies
CREATE POLICY alert_rules_select ON alert_rules
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY alert_rules_insert ON alert_rules
  FOR INSERT WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY alert_rules_update ON alert_rules
  FOR UPDATE USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY alert_rules_delete ON alert_rules
  FOR DELETE USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Notifications policies
CREATE POLICY notifications_select ON notifications
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Health checks policies
CREATE POLICY health_checks_select ON health_checks
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY health_checks_insert ON health_checks
  FOR INSERT WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Tenant templates policies
CREATE POLICY tenant_templates_select ON tenant_templates
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY tenant_templates_insert ON tenant_templates
  FOR INSERT WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY tenant_templates_update ON tenant_templates
  FOR UPDATE USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY tenant_templates_delete ON tenant_templates
  FOR DELETE USING (workspace_id IN (
    SELECT workspace_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- ====================
-- Comments
-- ====================

COMMENT ON TABLE usage_metrics IS 'Tracks CLI usage, API calls, and resource consumption';
COMMENT ON TABLE alerts IS 'Credential expiry alerts and system notifications';
COMMENT ON TABLE alert_rules IS 'Alert configuration and routing rules';
COMMENT ON TABLE notifications IS 'Unified notification history across all channels';
COMMENT ON TABLE health_checks IS 'System health check results';
COMMENT ON TABLE tenant_templates IS 'Custom tenant templates for quick provisioning';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON alert_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON health_checks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_templates TO authenticated;
