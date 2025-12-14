-- ============================================================================
-- Migration 434: Synthex Safety Guardrails & AI Compliance
-- ============================================================================
-- Description: AI compliance, audit logging, guardrail policies, and safety incidents
-- Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
-- Dependencies: Requires synthex_tenants table
-- Author: Backend Architect Agent
-- Date: 2025-12-06

-- ============================================================================
-- Table: synthex_guardrail_policies
-- ============================================================================
-- Stores guardrail policies per tenant for AI safety and compliance

CREATE TABLE IF NOT EXISTS synthex_guardrail_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Policy',

  -- Policy mode
  mode TEXT NOT NULL DEFAULT 'moderate' CHECK (mode IN ('strict', 'moderate', 'open')),

  -- Content filtering
  blocked_phrases TEXT[] DEFAULT '{}',
  allowed_topics TEXT[] DEFAULT '{}',

  -- PII detection rules
  pii_rules JSONB DEFAULT '{
    "mask_email": true,
    "mask_phone": true,
    "mask_ssn": true,
    "mask_credit_card": true,
    "mask_address": false,
    "mask_name": false
  }'::jsonb,

  -- Token limits
  max_input_tokens INTEGER DEFAULT 10000,
  max_output_tokens INTEGER DEFAULT 4000,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id)
);

-- ============================================================================
-- Table: synthex_ai_audit_log
-- ============================================================================
-- Comprehensive audit log for all AI service calls

CREATE TABLE IF NOT EXISTS synthex_ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Service context
  service_name TEXT NOT NULL, -- 'assistant', 'content', 'insight', 'lead_engine', etc.
  route TEXT, -- API route or function name

  -- Request/Response data (truncated for privacy)
  input_preview TEXT, -- First 500 chars
  output_preview TEXT, -- First 500 chars

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  -- Risk assessment
  risk_score NUMERIC(5,2) DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,

  -- Performance
  response_time_ms INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance queries
DROP INDEX IF EXISTS idx_ai_audit_log_tenant_created;
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_tenant_created ON synthex_ai_audit_log(tenant_id, created_at DESC);
DROP INDEX IF EXISTS idx_ai_audit_log_flagged;
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_flagged ON synthex_ai_audit_log(tenant_id, flagged) WHERE flagged = true;
DROP INDEX IF EXISTS idx_ai_audit_log_service;
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_service ON synthex_ai_audit_log(tenant_id, service_name, created_at DESC);

-- ============================================================================
-- Table: synthex_safety_incidents
-- ============================================================================
-- Tracks safety incidents requiring human review

CREATE TABLE IF NOT EXISTS synthex_safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Incident type
  type TEXT NOT NULL CHECK (type IN (
    'pii_detected',
    'blocked_phrase',
    'high_risk',
    'rate_limit',
    'policy_violation'
  )),

  -- Severity
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Details
  details JSONB DEFAULT '{}'::jsonb,

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for incident queries
DROP INDEX IF EXISTS idx_safety_incidents_tenant_created;
CREATE INDEX IF NOT EXISTS idx_safety_incidents_tenant_created ON synthex_safety_incidents(tenant_id, created_at DESC);
DROP INDEX IF EXISTS idx_safety_incidents_unresolved;
CREATE INDEX IF NOT EXISTS idx_safety_incidents_unresolved ON synthex_safety_incidents(tenant_id, resolved) WHERE resolved = false;
DROP INDEX IF EXISTS idx_safety_incidents_severity;
CREATE INDEX IF NOT EXISTS idx_safety_incidents_severity ON synthex_safety_incidents(tenant_id, severity, created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE synthex_guardrail_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_ai_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_safety_incidents ENABLE ROW LEVEL SECURITY;

-- Guardrail Policies RLS
DROP POLICY IF EXISTS "Tenants can view their own guardrail policies" ON synthex_guardrail_policies;
CREATE POLICY "Tenants can view their own guardrail policies"
  ON synthex_guardrail_policies
  FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE id = tenant_id
  ));

DROP POLICY IF EXISTS "Tenants can update their own guardrail policies" ON synthex_guardrail_policies;
CREATE POLICY "Tenants can update their own guardrail policies"
  ON synthex_guardrail_policies
  FOR UPDATE
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE id = tenant_id
  ));

DROP POLICY IF EXISTS "Tenants can insert their own guardrail policies" ON synthex_guardrail_policies;
CREATE POLICY "Tenants can insert their own guardrail policies"
  ON synthex_guardrail_policies
  FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE id = tenant_id
  ));

-- AI Audit Log RLS (read-only for tenants, system can insert)
DROP POLICY IF EXISTS "Tenants can view their own audit logs" ON synthex_ai_audit_log;
CREATE POLICY "Tenants can view their own audit logs"
  ON synthex_ai_audit_log
  FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE id = tenant_id
  ));

DROP POLICY IF EXISTS "System can insert audit logs" ON synthex_ai_audit_log;
CREATE POLICY "System can insert audit logs"
  ON synthex_ai_audit_log
  FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- Safety Incidents RLS
DROP POLICY IF EXISTS "Tenants can view their own safety incidents" ON synthex_safety_incidents;
CREATE POLICY "Tenants can view their own safety incidents"
  ON synthex_safety_incidents
  FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE id = tenant_id
  ));

DROP POLICY IF EXISTS "Tenants can update their own safety incidents" ON synthex_safety_incidents;
CREATE POLICY "Tenants can update their own safety incidents"
  ON synthex_safety_incidents
  FOR UPDATE
  USING (tenant_id IN (
    SELECT id FROM synthex_tenants WHERE id = tenant_id
  ));

DROP POLICY IF EXISTS "System can insert safety incidents" ON synthex_safety_incidents;
CREATE POLICY "System can insert safety incidents"
  ON synthex_safety_incidents
  FOR INSERT
  WITH CHECK (true); -- Allow service role to insert

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_synthex_guardrail_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for guardrail policies
DROP TRIGGER IF EXISTS trigger_update_guardrail_policies_updated_at ON synthex_guardrail_policies;
CREATE TRIGGER trigger_update_guardrail_policies_updated_at
  BEFORE UPDATE ON synthex_guardrail_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_guardrail_policies_updated_at();

-- ============================================================================
-- Seed Data (Default Policies)
-- ============================================================================

-- Insert default policies for existing tenants (if they don't have one)
-- This is safe to run multiple times due to UNIQUE constraint
INSERT INTO synthex_guardrail_policies (tenant_id, name, mode, blocked_phrases, pii_rules, max_input_tokens, max_output_tokens)
SELECT
  id,
  'Default Policy',
  'moderate',
  ARRAY['password', 'secret', 'confidential']::TEXT[],
  '{
    "mask_email": true,
    "mask_phone": true,
    "mask_ssn": true,
    "mask_credit_card": true,
    "mask_address": false,
    "mask_name": false
  }'::jsonb,
  10000,
  4000
FROM synthex_tenants
WHERE NOT EXISTS (
  SELECT 1 FROM synthex_guardrail_policies WHERE tenant_id = synthex_tenants.id
);

-- ============================================================================
-- Grants
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON synthex_guardrail_policies TO authenticated;
GRANT SELECT ON synthex_ai_audit_log TO authenticated;
GRANT SELECT, UPDATE ON synthex_safety_incidents TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE synthex_guardrail_policies IS 'Phase B28: AI guardrail policies per tenant';
COMMENT ON TABLE synthex_ai_audit_log IS 'Phase B28: Comprehensive AI service audit log';
COMMENT ON TABLE synthex_safety_incidents IS 'Phase B28: Safety incidents requiring review';
