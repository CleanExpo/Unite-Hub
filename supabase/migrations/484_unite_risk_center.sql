-- =====================================================================
-- Phase D56: Risk, Compliance & Guardrail Center
-- =====================================================================
-- Tables: unite_risk_events, unite_policies, unite_policy_violations
--
-- Purpose:
-- - Centralized risk event tracking across all systems
-- - Policy definition and enforcement
-- - Compliance violation detection and resolution
-- - AI-powered risk assessment and recommendations
--
-- Key Concepts:
-- - Risk events capture anomalies, errors, and compliance issues
-- - Policies define rules and constraints for system behavior
-- - Violations track policy breaches with AI summaries
-- - Uses RLS for tenant isolation (optional tenant_id for global policies)
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08
-- Migration: 484

-- =====================================================================
-- 1. Tables
-- =====================================================================

-- Risk events table
CREATE TABLE IF NOT EXISTS unite_risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, -- NULL for system-wide events

  -- Event details
  source text NOT NULL, -- 'email_agent', 'content_generator', 'campaign_executor', etc.
  category text NOT NULL, -- 'compliance', 'security', 'performance', 'quality', etc.
  severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
  code text, -- Error code or identifier
  message text,

  -- Context and metadata
  context jsonb, -- Full event context (sanitized, no PII)
  ai_assessment jsonb, -- AI-generated risk analysis

  -- Resolution tracking
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Policies table
CREATE TABLE IF NOT EXISTS unite_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, -- NULL for global policies

  -- Policy identification
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  scope text NOT NULL, -- 'email', 'content', 'campaign', 'api', 'global', etc.

  -- Policy status
  status text NOT NULL DEFAULT 'active', -- 'active', 'draft', 'archived'

  -- Policy rules (structured configuration)
  rules jsonb NOT NULL, -- { "max_daily_emails": 1000, "required_fields": ["unsubscribe_link"] }

  -- AI profile for policy enforcement
  ai_profile jsonb, -- AI settings for violation detection

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Policy violations table
CREATE TABLE IF NOT EXISTS unite_policy_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid, -- NULL for system-wide violations
  policy_id uuid REFERENCES unite_policies(id) ON DELETE CASCADE,

  -- Violation details
  source text NOT NULL, -- System/agent that triggered the violation
  reference_id text, -- ID of the object that violated the policy
  severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'

  -- Violation data
  details jsonb, -- Full violation context (sanitized)
  ai_summary jsonb, -- AI-generated violation summary and recommendations

  -- Resolution tracking
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================

-- Risk Events
CREATE INDEX IF NOT EXISTS idx_unite_risk_events_tenant
  ON unite_risk_events(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unite_risk_events_severity
  ON unite_risk_events(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unite_risk_events_category
  ON unite_risk_events(category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unite_risk_events_unresolved
  ON unite_risk_events(tenant_id, resolved_at)
  WHERE resolved_at IS NULL;

-- Policies
CREATE UNIQUE INDEX IF NOT EXISTS idx_unite_policies_tenant_slug
  ON unite_policies(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

CREATE INDEX IF NOT EXISTS idx_unite_policies_scope
  ON unite_policies(scope, status);

-- Policy Violations
CREATE INDEX IF NOT EXISTS idx_unite_policy_violations_tenant
  ON unite_policy_violations(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unite_policy_violations_policy
  ON unite_policy_violations(policy_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unite_policy_violations_unresolved
  ON unite_policy_violations(tenant_id, resolved_at)
  WHERE resolved_at IS NULL;

-- =====================================================================
-- 3. RLS Policies
-- =====================================================================

ALTER TABLE unite_risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_policy_violations ENABLE ROW LEVEL SECURITY;

-- Risk Events (tenant-scoped OR global)
DROP POLICY IF EXISTS "tenant_or_global" ON unite_risk_events;
CREATE POLICY "tenant_or_global" ON unite_risk_events
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- Policies (tenant-scoped OR global)
DROP POLICY IF EXISTS "tenant_or_global" ON unite_policies;
CREATE POLICY "tenant_or_global" ON unite_policies
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- Policy Violations (tenant-scoped OR global)
DROP POLICY IF EXISTS "tenant_or_global" ON unite_policy_violations;
CREATE POLICY "tenant_or_global" ON unite_policy_violations
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- =====================================================================
-- 4. Helper Functions
-- =====================================================================

/**
 * Get risk dashboard summary
 */
CREATE OR REPLACE FUNCTION unite_get_risk_summary(
  p_tenant_id uuid,
  p_days integer DEFAULT 30
) RETURNS TABLE(
  total_events bigint,
  unresolved_events bigint,
  critical_events bigint,
  events_by_severity jsonb,
  events_by_category jsonb,
  total_violations bigint,
  unresolved_violations bigint,
  violations_by_policy jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH event_stats AS (
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE resolved_at IS NULL)::bigint AS unresolved,
      COUNT(*) FILTER (WHERE severity = 'critical')::bigint AS critical,
      jsonb_object_agg(
        severity,
        count
      ) AS by_severity,
      jsonb_object_agg(
        category,
        cat_count
      ) AS by_category
    FROM unite_risk_events
    WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY severity, category
  ),
  violation_stats AS (
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE resolved_at IS NULL)::bigint AS unresolved,
      jsonb_object_agg(
        p.name,
        v_count
      ) AS by_policy
    FROM unite_policy_violations v
    LEFT JOIN unite_policies p ON v.policy_id = p.id
    WHERE (v.tenant_id = p_tenant_id OR v.tenant_id IS NULL)
      AND v.created_at >= NOW() - (p_days || ' days')::interval
    GROUP BY p.name
  )
  SELECT
    COALESCE(es.total, 0) AS total_events,
    COALESCE(es.unresolved, 0) AS unresolved_events,
    COALESCE(es.critical, 0) AS critical_events,
    COALESCE(es.by_severity, '{}'::jsonb) AS events_by_severity,
    COALESCE(es.by_category, '{}'::jsonb) AS events_by_category,
    COALESCE(vs.total, 0) AS total_violations,
    COALESCE(vs.unresolved, 0) AS unresolved_violations,
    COALESCE(vs.by_policy, '{}'::jsonb) AS violations_by_policy
  FROM event_stats es
  CROSS JOIN violation_stats vs;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Check if an action violates any policies
 */
CREATE OR REPLACE FUNCTION unite_check_policy_compliance(
  p_tenant_id uuid,
  p_scope text,
  p_action_data jsonb
) RETURNS TABLE(
  violated boolean,
  policy_id uuid,
  policy_name text,
  violation_reason text
) AS $$
DECLARE
  v_policy record;
  v_rules jsonb;
BEGIN
  -- Iterate through active policies for this scope
  FOR v_policy IN
    SELECT id, name, rules
    FROM unite_policies
    WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND scope = p_scope
      AND status = 'active'
  LOOP
    v_rules := v_policy.rules;

    -- Example: Check max_daily_emails rule
    IF v_rules ? 'max_daily_emails' THEN
      IF (p_action_data->>'email_count')::int > (v_rules->>'max_daily_emails')::int THEN
        violated := true;
        policy_id := v_policy.id;
        policy_name := v_policy.name;
        violation_reason := 'Exceeded maximum daily emails';
        RETURN NEXT;
      END IF;
    END IF;

    -- Add more rule checks as needed
  END LOOP;

  -- No violations found
  IF NOT FOUND THEN
    violated := false;
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION unite_get_risk_summary IS 'Get risk and compliance dashboard summary';
COMMENT ON FUNCTION unite_check_policy_compliance IS 'Check if an action violates any policies (returns violations if any)';
