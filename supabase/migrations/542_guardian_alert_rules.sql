-- Guardian Phase G35: Alert Rules & Events Foundation
-- Migration: 542
-- Purpose: Store Guardian alert rule definitions and event history per-tenant
-- Tables: guardian_alert_rules, guardian_alert_events

-- ============================================================================
-- TABLE: guardian_alert_rules
-- ============================================================================
-- Stores alert rule definitions (per-tenant)
-- Defines when alerts should fire, severity, source, and notification channel
-- Only guardian_admin can create/modify rules; all Guardian roles can view
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source TEXT NOT NULL CHECK (source IN ('telemetry', 'warehouse', 'replay', 'scenarios', 'guardian')),
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'webhook', 'pager')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: guardian_alert_events
-- ============================================================================
-- Stores alert event history (per-tenant)
-- Records when alert rules were triggered
-- Future phases will auto-populate this table when conditions are met
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES guardian_alert_rules(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source TEXT NOT NULL CHECK (source IN ('telemetry', 'warehouse', 'replay', 'scenarios', 'guardian')),
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query pattern: tenant + active status + severity
CREATE INDEX idx_guardian_alert_rules_tenant_active
  ON guardian_alert_rules (tenant_id, is_active, severity);

-- Primary query pattern: tenant + time-based event lookups
CREATE INDEX idx_guardian_alert_events_tenant_time
  ON guardian_alert_events (tenant_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE guardian_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_alert_events ENABLE ROW LEVEL SECURITY;

-- Alert Rules: All Guardian roles can SELECT, only service can INSERT/UPDATE
CREATE POLICY tenant_select_guardian_alert_rules ON guardian_alert_rules
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY tenant_insert_guardian_alert_rules ON guardian_alert_rules
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY tenant_update_guardian_alert_rules ON guardian_alert_rules
  FOR UPDATE USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Alert Events: All Guardian roles can SELECT, only service can INSERT
CREATE POLICY tenant_select_guardian_alert_events ON guardian_alert_events
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY tenant_insert_guardian_alert_events ON guardian_alert_events
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE guardian_alert_rules IS 'Guardian alert rule definitions (G35)';
COMMENT ON TABLE guardian_alert_events IS 'Guardian alert event history (G35)';
COMMENT ON COLUMN guardian_alert_rules.condition IS 'JSONB condition logic - evaluated in future phases';
COMMENT ON COLUMN guardian_alert_rules.channel IS 'Notification channel - external delivery in future phases';
