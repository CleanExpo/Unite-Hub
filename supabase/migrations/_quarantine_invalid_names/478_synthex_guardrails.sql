-- =====================================================================
-- Phase D49: Global Guardrails & Kill Switch (Autonomy Safety Layer)
-- =====================================================================
-- Tables: synthex_guardrail_policies, synthex_guardrail_violations, synthex_kill_switch_states
--
-- Purpose:
-- - Global safety guardrails for autonomous systems
-- - Violation tracking and blocking
-- - Emergency kill switch for scopes and targets
-- - Designed to be called from orchestrator, agents, delivery, and automation
--
-- Key Concepts:
-- - Policies define rules with severity levels
-- - Violations log breaches and can block execution
-- - Kill switches provide emergency stop for any scope/target
-- - Tenant-isolated with RLS for all tables
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. Guardrail Policies Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_guardrail_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Policy identification
  scope text NOT NULL, -- 'agent' | 'delivery' | 'automation' | 'campaign' | 'global'
  key text NOT NULL, -- Unique key within scope (e.g., 'max_daily_spend', 'content_safety')
  name text NOT NULL,
  description text,

  -- Configuration
  enabled boolean NOT NULL DEFAULT true,
  config jsonb, -- { "threshold": 1000, "time_window": "24h", "action": "block|warn|log" }
  severity text NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. Guardrail Violations Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_guardrail_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  policy_id uuid REFERENCES synthex_guardrail_policies(id) ON DELETE SET NULL,

  -- Violation source
  source_type text NOT NULL, -- 'agent' | 'delivery' | 'automation' | 'campaign' | 'workflow'
  source_ref text, -- Reference to the source entity

  -- Violation details
  severity text NOT NULL, -- Inherited from policy or overridden
  message text NOT NULL,
  context jsonb, -- { "actual_value": 1500, "threshold": 1000, "details": "..." }
  blocked boolean NOT NULL DEFAULT false, -- Whether the action was blocked

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 3. Kill Switch States Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_kill_switch_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Kill switch target
  scope text NOT NULL, -- 'global' | 'agent' | 'delivery' | 'automation' | 'campaign'
  target text NOT NULL, -- Specific target within scope (e.g., 'all', 'email-agent', 'campaign:uuid')

  -- State
  enabled boolean NOT NULL DEFAULT false, -- true = kill switch is ON (system halted)
  reason text, -- Why was it triggered
  metadata jsonb, -- Additional context

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 4. Indexes
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_guardrail_policies_tenant
  ON synthex_guardrail_policies(tenant_id);

CREATE INDEX IF NOT EXISTS idx_synthex_guardrail_policies_scope_key
  ON synthex_guardrail_policies(tenant_id, scope, key);

CREATE INDEX IF NOT EXISTS idx_synthex_guardrail_violations_tenant
  ON synthex_guardrail_violations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_synthex_guardrail_violations_created
  ON synthex_guardrail_violations(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_kill_switch_states_tenant
  ON synthex_kill_switch_states(tenant_id);

CREATE INDEX IF NOT EXISTS idx_synthex_kill_switch_states_scope_target
  ON synthex_kill_switch_states(tenant_id, scope, target);

-- =====================================================================
-- 5. Row Level Security (RLS)
-- =====================================================================

ALTER TABLE synthex_guardrail_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_guardrail_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_kill_switch_states ENABLE ROW LEVEL SECURITY;

-- Policies tenant isolation
DROP POLICY IF EXISTS "tenant_isolation" ON synthex_guardrail_policies;
CREATE POLICY "tenant_isolation" ON synthex_guardrail_policies
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Violations tenant isolation
DROP POLICY IF EXISTS "tenant_isolation" ON synthex_guardrail_violations;
CREATE POLICY "tenant_isolation" ON synthex_guardrail_violations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Kill switch tenant isolation
DROP POLICY IF EXISTS "tenant_isolation" ON synthex_kill_switch_states;
CREATE POLICY "tenant_isolation" ON synthex_kill_switch_states
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 6. Helper Functions
-- =====================================================================

/**
 * Get active kill switches for a scope/target
 */
CREATE OR REPLACE FUNCTION synthex_check_kill_switch(
  p_tenant_id uuid,
  p_scope text,
  p_target text DEFAULT 'all'
) RETURNS boolean AS $$
DECLARE
  v_global_enabled boolean;
  v_specific_enabled boolean;
BEGIN
  -- Check global kill switch first
  SELECT enabled INTO v_global_enabled
  FROM synthex_kill_switch_states
  WHERE tenant_id = p_tenant_id
    AND scope = 'global'
    AND target = 'all'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_global_enabled = true THEN
    RETURN true;
  END IF;

  -- Check specific scope/target
  SELECT enabled INTO v_specific_enabled
  FROM synthex_kill_switch_states
  WHERE tenant_id = p_tenant_id
    AND scope = p_scope
    AND target = p_target
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN COALESCE(v_specific_enabled, false);
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get violation summary for a tenant
 */
CREATE OR REPLACE FUNCTION synthex_get_violation_summary(
  p_tenant_id uuid,
  p_days integer DEFAULT 7
) RETURNS TABLE(
  total_violations integer,
  blocked_violations integer,
  critical_violations integer,
  high_violations integer,
  recent_violations_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer AS total_violations,
    COUNT(*) FILTER (WHERE blocked = true)::integer AS blocked_violations,
    COUNT(*) FILTER (WHERE severity = 'critical')::integer AS critical_violations,
    COUNT(*) FILTER (WHERE severity = 'high')::integer AS high_violations,
    COUNT(*) FILTER (WHERE created_at >= NOW() - (p_days || ' days')::interval)::integer AS recent_violations_count
  FROM synthex_guardrail_violations
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE;
