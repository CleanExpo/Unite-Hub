-- =====================================================================
-- Phase D63: AI Governance, Policy & Audit Center
-- =====================================================================
-- Tables: unite_ai_policies, unite_ai_usage_logs, unite_ai_violations, unite_ai_audits
-- Enables tracking AI usage, enforcing policies, and maintaining compliance
--
-- Migration: 491

DROP TABLE IF EXISTS unite_ai_audits CASCADE;
DROP TABLE IF EXISTS unite_ai_violations CASCADE;
DROP TABLE IF EXISTS unite_ai_usage_logs CASCADE;
DROP TABLE IF EXISTS unite_ai_policies CASCADE;

-- AI Policies - governance rules for AI usage
CREATE TABLE unite_ai_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  policy_key text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  rules jsonb NOT NULL,
  enforcement_level text NOT NULL DEFAULT 'warning',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Usage Logs - track all AI model invocations
CREATE TABLE unite_ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  model_name text NOT NULL,
  provider text NOT NULL,
  operation text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  total_cost numeric(10,4),
  latency_ms integer,
  status text NOT NULL,
  error_message text,
  metadata jsonb,
  occurred_at timestamptz DEFAULT now()
);

-- AI Policy Violations - track policy breaches
CREATE TABLE unite_ai_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  policy_id uuid REFERENCES unite_ai_policies(id) ON DELETE CASCADE,
  usage_log_id uuid REFERENCES unite_ai_usage_logs(id) ON DELETE CASCADE,
  violation_type text NOT NULL,
  severity text NOT NULL,
  description text,
  resolution_status text DEFAULT 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  metadata jsonb,
  detected_at timestamptz DEFAULT now()
);

-- AI Audits - periodic compliance audits
CREATE TABLE unite_ai_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  audit_type text NOT NULL,
  scope text NOT NULL,
  findings jsonb,
  recommendations jsonb,
  compliance_score numeric(5,2),
  auditor text,
  status text DEFAULT 'pending',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes
CREATE INDEX idx_unite_ai_policies_tenant ON unite_ai_policies(tenant_id, is_active);
CREATE INDEX idx_unite_ai_policies_category ON unite_ai_policies(category);
CREATE INDEX idx_unite_ai_usage_logs_tenant ON unite_ai_usage_logs(tenant_id, occurred_at DESC);
CREATE INDEX idx_unite_ai_usage_logs_user ON unite_ai_usage_logs(user_id, occurred_at DESC);
CREATE INDEX idx_unite_ai_usage_logs_model ON unite_ai_usage_logs(model_name, provider);
CREATE INDEX idx_unite_ai_violations_tenant ON unite_ai_violations(tenant_id, resolution_status);
CREATE INDEX idx_unite_ai_violations_policy ON unite_ai_violations(policy_id);
CREATE INDEX idx_unite_ai_audits_tenant ON unite_ai_audits(tenant_id, status);

-- RLS Policies
ALTER TABLE unite_ai_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_ai_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_ai_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON unite_ai_policies
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_ai_usage_logs
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_ai_violations
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_ai_audits
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Helper Functions
CREATE OR REPLACE FUNCTION unite_get_ai_governance_summary(p_tenant_id uuid DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_usage_logs', (SELECT COUNT(*) FROM unite_ai_usage_logs WHERE tenant_id = p_tenant_id OR p_tenant_id IS NULL),
    'total_violations', (SELECT COUNT(*) FROM unite_ai_violations WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL) AND resolution_status = 'open'),
    'active_policies', (SELECT COUNT(*) FROM unite_ai_policies WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL) AND is_active = true),
    'pending_audits', (SELECT COUNT(*) FROM unite_ai_audits WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL) AND status = 'pending'),
    'total_cost_30d', (
      SELECT COALESCE(SUM(total_cost), 0)
      FROM unite_ai_usage_logs
      WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL)
        AND occurred_at >= NOW() - INTERVAL '30 days'
    ),
    'avg_compliance_score', (
      SELECT COALESCE(AVG(compliance_score), 0)
      FROM unite_ai_audits
      WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL)
        AND status = 'completed'
    )
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;
