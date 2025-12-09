-- Migration 439: Policy Engine v1 (Phase E24)
-- Tenant-scoped policy rules and triggers for automation

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS policy_triggers CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

-- Policy status
DO $$ BEGIN
  CREATE TYPE policy_status AS ENUM ('active', 'inactive', 'draft');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy trigger type
DO $$ BEGIN
  CREATE TYPE policy_trigger_type AS ENUM (
    'rate_limit_exceeded',
    'security_event',
    'compliance_violation',
    'incident_created',
    'audit_event',
    'threshold_exceeded',
    'schedule',
    'webhook',
    'manual',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy action type
DO $$ BEGIN
  CREATE TYPE policy_action_type AS ENUM (
    'send_notification',
    'create_incident',
    'trigger_webhook',
    'block_request',
    'update_rate_limit',
    'send_email',
    'log_audit_event',
    'execute_workflow',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policies table
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status policy_status NOT NULL DEFAULT 'draft',
  trigger_type policy_trigger_type NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Conditions that must be met
  action_type policy_action_type NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb, -- Configuration for the action
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority executes first
  cooldown_seconds INTEGER DEFAULT 0, -- Minimum time between executions
  last_triggered_at TIMESTAMPTZ,
  execution_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policies_tenant ON policies(tenant_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_trigger_type ON policies(trigger_type);
CREATE INDEX idx_policies_priority ON policies(priority DESC);
CREATE INDEX idx_policies_tenant_status ON policies(tenant_id, status);

-- Policy Triggers table (execution log)
CREATE TABLE policy_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_by TEXT, -- User or system that triggered it
  trigger_data JSONB DEFAULT '{}'::jsonb, -- Data that triggered the policy
  action_result TEXT, -- Result of the action execution
  success BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_triggers_policy ON policy_triggers(policy_id);
CREATE INDEX idx_policy_triggers_tenant ON policy_triggers(tenant_id, created_at DESC);
CREATE INDEX idx_policy_triggers_created_at ON policy_triggers(created_at DESC);
CREATE INDEX idx_policy_triggers_success ON policy_triggers(success);

-- RLS for policies
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY policies_read_own ON policies
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY policies_tenant_manage ON policies
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for policy_triggers
ALTER TABLE policy_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY policy_triggers_read_own ON policy_triggers
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY policy_triggers_insert_own ON policy_triggers
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Drop existing functions if they exist (drop all overloaded variants)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_policy CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS trigger_policy CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_policy_statistics CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS check_policy_cooldown CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Create policy
CREATE OR REPLACE FUNCTION create_policy(
  p_tenant_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_status policy_status,
  p_trigger_type policy_trigger_type,
  p_trigger_conditions JSONB,
  p_action_type policy_action_type,
  p_action_config JSONB,
  p_priority INTEGER DEFAULT 0,
  p_cooldown_seconds INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_policy_id UUID;
BEGIN
  INSERT INTO policies (
    tenant_id,
    name,
    description,
    status,
    trigger_type,
    trigger_conditions,
    action_type,
    action_config,
    priority,
    cooldown_seconds,
    metadata
  ) VALUES (
    p_tenant_id,
    p_name,
    p_description,
    p_status,
    p_trigger_type,
    p_trigger_conditions,
    p_action_type,
    p_action_config,
    p_priority,
    p_cooldown_seconds,
    p_metadata
  )
  RETURNING id INTO v_policy_id;

  RETURN v_policy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Trigger policy
CREATE OR REPLACE FUNCTION trigger_policy(
  p_policy_id UUID,
  p_tenant_id UUID,
  p_triggered_by TEXT,
  p_trigger_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_trigger_id UUID;
  v_policy RECORD;
  v_cooldown_ok BOOLEAN;
BEGIN
  -- Get policy details
  SELECT * INTO v_policy
  FROM policies
  WHERE id = p_policy_id
    AND tenant_id = p_tenant_id
    AND status = 'active';

  IF v_policy IS NULL THEN
    RAISE EXCEPTION 'Policy not found or not active';
  END IF;

  -- Check cooldown
  IF v_policy.cooldown_seconds > 0 AND v_policy.last_triggered_at IS NOT NULL THEN
    v_cooldown_ok := (now() - v_policy.last_triggered_at) > (v_policy.cooldown_seconds || ' seconds')::interval;
    IF NOT v_cooldown_ok THEN
      RAISE EXCEPTION 'Policy is in cooldown period';
    END IF;
  END IF;

  -- Record trigger
  INSERT INTO policy_triggers (
    policy_id,
    tenant_id,
    triggered_by,
    trigger_data,
    success,
    action_result
  ) VALUES (
    p_policy_id,
    p_tenant_id,
    p_triggered_by,
    p_trigger_data,
    TRUE,
    'Policy triggered successfully'
  )
  RETURNING id INTO v_trigger_id;

  -- Update policy execution stats
  UPDATE policies
  SET last_triggered_at = now(),
      execution_count = execution_count + 1,
      updated_at = now()
  WHERE id = p_policy_id;

  RETURN v_trigger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get policy statistics
CREATE OR REPLACE FUNCTION get_policy_statistics(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total INTEGER;
  v_active INTEGER;
  v_inactive INTEGER;
  v_draft INTEGER;
  v_by_trigger_type JSONB;
  v_recent_triggers JSONB;
BEGIN
  -- Count by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'inactive'),
    COUNT(*) FILTER (WHERE status = 'draft')
  INTO v_total, v_active, v_inactive, v_draft
  FROM policies
  WHERE tenant_id = p_tenant_id;

  -- Count by trigger type
  SELECT jsonb_object_agg(trigger_type, count)
  INTO v_by_trigger_type
  FROM (
    SELECT trigger_type::TEXT, COUNT(*) as count
    FROM policies
    WHERE tenant_id = p_tenant_id
    GROUP BY trigger_type
  ) t;

  -- Recent triggers (last 10)
  SELECT jsonb_agg(trigger_data)
  INTO v_recent_triggers
  FROM (
    SELECT jsonb_build_object(
      'policy_id', policy_id,
      'triggered_by', triggered_by,
      'success', success,
      'created_at', created_at
    ) as trigger_data
    FROM policy_triggers
    WHERE tenant_id = p_tenant_id
    ORDER BY created_at DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'active', COALESCE(v_active, 0),
    'inactive', COALESCE(v_inactive, 0),
    'draft', COALESCE(v_draft, 0),
    'by_trigger_type', COALESCE(v_by_trigger_type, '{}'::jsonb),
    'recent_triggers', COALESCE(v_recent_triggers, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check policy cooldown
CREATE OR REPLACE FUNCTION check_policy_cooldown(
  p_policy_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_policy RECORD;
BEGIN
  SELECT * INTO v_policy
  FROM policies
  WHERE id = p_policy_id;

  IF v_policy IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_policy.cooldown_seconds = 0 THEN
    RETURN TRUE;
  END IF;

  IF v_policy.last_triggered_at IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN (now() - v_policy.last_triggered_at) > (v_policy.cooldown_seconds || ' seconds')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_policy TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_policy TO authenticated;
GRANT EXECUTE ON FUNCTION get_policy_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION check_policy_cooldown TO authenticated;

-- Trigger to update policies.updated_at
CREATE OR REPLACE FUNCTION update_policy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policy_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_timestamp();

-- Auto-cleanup old policy triggers (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_policy_triggers() RETURNS void AS $$
BEGIN
  DELETE FROM policy_triggers
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_policy_triggers() IS 'Run periodically via cron to delete policy triggers >30 days old. Call: SELECT cleanup_old_policy_triggers();';
