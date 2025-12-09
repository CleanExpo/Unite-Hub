/**
 * Phase D68: Unite Self-Healing & Guardrail Automation
 *
 * Self-healing must only ever run idempotent, reversible operations.
 * Destructive fixes must be flagged as manual-review-only.
 * Guardrail evaluation at service boundaries.
 */

-- ============================================================================
-- ERROR SIGNATURES (AI-powered pattern detection)
-- ============================================================================

DROP TABLE IF EXISTS unite_error_signatures CASCADE;

CREATE TABLE unite_error_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  signature_key text NOT NULL,
  pattern_regex text,
  severity text NOT NULL DEFAULT 'warning',
  category text NOT NULL,
  description text,
  fix_type text NOT NULL DEFAULT 'manual',
  fix_action jsonb,
  is_idempotent boolean NOT NULL DEFAULT true,
  is_reversible boolean NOT NULL DEFAULT true,
  auto_approve boolean NOT NULL DEFAULT false,
  occurrence_count integer NOT NULL DEFAULT 0,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_unite_error_signatures_tenant ON unite_error_signatures(tenant_id);
CREATE INDEX idx_unite_error_signatures_severity ON unite_error_signatures(severity);
CREATE INDEX idx_unite_error_signatures_category ON unite_error_signatures(category);
CREATE UNIQUE INDEX idx_unite_error_signatures_key ON unite_error_signatures(signature_key);

COMMENT ON TABLE unite_error_signatures IS 'AI-detected error patterns with fix recommendations';
COMMENT ON COLUMN unite_error_signatures.fix_type IS 'manual | auto_safe | auto_risky';
COMMENT ON COLUMN unite_error_signatures.fix_action IS 'Structured fix operation (e.g., {type: "restart_service", params: {...}})';
COMMENT ON COLUMN unite_error_signatures.auto_approve IS 'Whether fixes can run without human approval';

-- ============================================================================
-- SELF-HEALING RUNS (execution log)
-- ============================================================================

DROP TABLE IF EXISTS unite_self_healing_runs CASCADE;

CREATE TABLE unite_self_healing_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  signature_id uuid REFERENCES unite_error_signatures(id) ON DELETE CASCADE,
  event_id uuid,
  triggered_by text NOT NULL DEFAULT 'auto',
  status text NOT NULL DEFAULT 'pending',
  fix_action jsonb NOT NULL,
  execution_log jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  rollback_available boolean NOT NULL DEFAULT false,
  rollback_action jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_unite_self_healing_runs_tenant ON unite_self_healing_runs(tenant_id);
CREATE INDEX idx_unite_self_healing_runs_signature ON unite_self_healing_runs(signature_id);
CREATE INDEX idx_unite_self_healing_runs_status ON unite_self_healing_runs(status);
CREATE INDEX idx_unite_self_healing_runs_created ON unite_self_healing_runs(created_at DESC);

COMMENT ON TABLE unite_self_healing_runs IS 'Self-healing operation execution log with rollback capability';
COMMENT ON COLUMN unite_self_healing_runs.status IS 'pending | running | success | failed | rolled_back';
COMMENT ON COLUMN unite_self_healing_runs.triggered_by IS 'auto | manual | scheduled';
COMMENT ON COLUMN unite_self_healing_runs.rollback_action IS 'Inverse operation for reverting the fix';

-- ============================================================================
-- GUARDRAIL POLICIES (boundary validation)
-- ============================================================================

DROP TABLE IF EXISTS unite_guardrail_policies CASCADE;

CREATE TABLE unite_guardrail_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  policy_key text NOT NULL,
  name text NOT NULL,
  description text,
  boundary text NOT NULL,
  rule_type text NOT NULL DEFAULT 'validation',
  rule_config jsonb NOT NULL,
  enforcement text NOT NULL DEFAULT 'warn',
  is_active boolean NOT NULL DEFAULT true,
  violation_count integer NOT NULL DEFAULT 0,
  last_violation_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_unite_guardrail_policies_tenant ON unite_guardrail_policies(tenant_id);
CREATE INDEX idx_unite_guardrail_policies_boundary ON unite_guardrail_policies(boundary);
CREATE INDEX idx_unite_guardrail_policies_active ON unite_guardrail_policies(is_active);
CREATE UNIQUE INDEX idx_unite_guardrail_policies_key ON unite_guardrail_policies(policy_key);

COMMENT ON TABLE unite_guardrail_policies IS 'Service boundary validation rules';
COMMENT ON COLUMN unite_guardrail_policies.boundary IS 'api | agent | database | external | cost';
COMMENT ON COLUMN unite_guardrail_policies.rule_type IS 'validation | rate_limit | cost_cap | quota | auth';
COMMENT ON COLUMN unite_guardrail_policies.enforcement IS 'warn | block | throttle';
COMMENT ON COLUMN unite_guardrail_policies.rule_config IS 'Type-specific config (e.g., {max_requests: 100, window_seconds: 60})';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_error_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_self_healing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_guardrail_policies ENABLE ROW LEVEL SECURITY;

-- Error Signatures
CREATE POLICY "Users can view error signatures for their tenant"
  ON unite_error_signatures FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage error signatures for their tenant"
  ON unite_error_signatures FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Self-Healing Runs
CREATE POLICY "Users can view self-healing runs for their tenant"
  ON unite_self_healing_runs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage self-healing runs for their tenant"
  ON unite_self_healing_runs FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Guardrail Policies
CREATE POLICY "Users can view guardrail policies for their tenant"
  ON unite_guardrail_policies FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage guardrail policies for their tenant"
  ON unite_guardrail_policies FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
