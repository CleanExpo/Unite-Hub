-- Guardian Phase G45: Rule Templates & Editor
-- Migration: 547
-- Purpose: Store reusable rule templates for Guardian alert rules
-- Tables: guardian_rule_templates

-- ============================================================================
-- TABLE: guardian_rule_templates
-- ============================================================================
-- Stores reusable alert rule templates per tenant
-- Templates provide defaults for creating new rules quickly
-- Only guardian_admin can manage templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_rule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity_default TEXT CHECK (severity_default IN ('low', 'medium', 'high', 'critical')),
  channel_default TEXT CHECK (channel_default IN ('email', 'slack', 'webhook', 'in_app')),
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_rule_templates_tenant
  ON guardian_rule_templates (tenant_id, created_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_rule_templates ENABLE ROW LEVEL SECURITY;

-- Tenants can manage their own templates
CREATE POLICY tenant_rw_guardian_rule_templates
  ON guardian_rule_templates
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
CREATE POLICY service_all_guardian_rule_templates
  ON guardian_rule_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_rule_templates IS 'Reusable alert rule templates for quick rule creation';
COMMENT ON COLUMN guardian_rule_templates.definition IS 'Template definition (condition defaults, etc.)';
COMMENT ON COLUMN guardian_rule_templates.severity_default IS 'Default severity for rules created from this template';
COMMENT ON COLUMN guardian_rule_templates.channel_default IS 'Default notification channel for rules created from this template';
