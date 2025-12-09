/**
 * Phase D75: Unite Adaptive Recovery Engine
 *
 * Automated recovery with AI-enabled decision making.
 * CRITICAL: Must simulate before commit - NO destructive operations without approval.
 */

-- ============================================================================
-- RECOVERY POLICIES (recovery strategy definitions)
-- ============================================================================

DROP TABLE IF EXISTS unite_recovery_policies CASCADE;

CREATE TABLE unite_recovery_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  rules jsonb NOT NULL,
  enabled boolean DEFAULT true,
  tenant_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_recovery_policies_key ON unite_recovery_policies(key, enabled);
CREATE INDEX idx_unite_recovery_policies_tenant ON unite_recovery_policies(tenant_id, enabled);

COMMENT ON TABLE unite_recovery_policies IS 'Recovery policy definitions with automated rules';
COMMENT ON COLUMN unite_recovery_policies.key IS 'Policy identifier (e.g., "high_memory", "db_connection_pool")';
COMMENT ON COLUMN unite_recovery_policies.rules IS 'Recovery rules: {trigger_condition, recovery_action, simulation_required, max_retries}';
COMMENT ON COLUMN unite_recovery_policies.enabled IS 'Whether this policy is active';

-- ============================================================================
-- RECOVERY RUNS (execution history with AI traces)
-- ============================================================================

DROP TABLE IF EXISTS unite_recovery_runs CASCADE;

CREATE TABLE unite_recovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_key text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'simulating', 'simulated', 'executing', 'success', 'failed', 'cancelled')),
  trigger_event jsonb,
  simulation_result jsonb,
  execution_result jsonb,
  ai_trace jsonb,
  tenant_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_unite_recovery_runs_policy ON unite_recovery_runs(policy_key, status, started_at DESC);
CREATE INDEX idx_unite_recovery_runs_status ON unite_recovery_runs(status, started_at DESC);
CREATE INDEX idx_unite_recovery_runs_tenant ON unite_recovery_runs(tenant_id, started_at DESC);

COMMENT ON TABLE unite_recovery_runs IS 'Recovery execution history with AI decision traces';
COMMENT ON COLUMN unite_recovery_runs.policy_key IS 'Reference to recovery policy';
COMMENT ON COLUMN unite_recovery_runs.status IS 'Execution status: pending | simulating | simulated | executing | success | failed | cancelled';
COMMENT ON COLUMN unite_recovery_runs.trigger_event IS 'Event that triggered recovery: {component, severity, metrics}';
COMMENT ON COLUMN unite_recovery_runs.simulation_result IS 'Simulation outcome: {predicted_impact, risk_score, recommended_action}';
COMMENT ON COLUMN unite_recovery_runs.execution_result IS 'Actual execution outcome: {actions_taken, metrics_before, metrics_after}';
COMMENT ON COLUMN unite_recovery_runs.ai_trace IS 'AI reasoning trace: {model, prompt, response, thinking_tokens}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_recovery_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_recovery_runs ENABLE ROW LEVEL SECURITY;

-- Recovery Policies
CREATE POLICY "Users can view recovery policies for their tenant"
  ON unite_recovery_policies FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage recovery policies for their tenant"
  ON unite_recovery_policies FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Recovery Runs
CREATE POLICY "Users can view recovery runs for their tenant"
  ON unite_recovery_runs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage recovery runs for their tenant"
  ON unite_recovery_runs FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
