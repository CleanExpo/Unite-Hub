/**
 * Phase D72: Unite Runtime Adaptive Orchestrator
 *
 * Adaptive runtime strategies with side-effect-free evaluation.
 * AI-enabled decision making and execution orchestration.
 */

-- ============================================================================
-- RUNTIME SIGNALS (system health and performance signals)
-- ============================================================================

DROP TABLE IF EXISTS unite_runtime_signals CASCADE;

CREATE TABLE unite_runtime_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type text NOT NULL,
  source_system text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  threshold_value numeric,
  metadata jsonb,
  tenant_id uuid,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_unite_runtime_signals_tenant ON unite_runtime_signals(tenant_id);
CREATE INDEX idx_unite_runtime_signals_severity ON unite_runtime_signals(severity);
CREATE INDEX idx_unite_runtime_signals_type ON unite_runtime_signals(signal_type);
CREATE INDEX idx_unite_runtime_signals_unresolved ON unite_runtime_signals(detected_at DESC) WHERE resolved_at IS NULL;

COMMENT ON TABLE unite_runtime_signals IS 'Runtime health and performance signals for adaptive orchestration';
COMMENT ON COLUMN unite_runtime_signals.signal_type IS 'Signal category (e.g., "latency_spike", "error_rate", "cpu_usage")';
COMMENT ON COLUMN unite_runtime_signals.source_system IS 'System generating the signal (e.g., "api", "database", "queue")';
COMMENT ON COLUMN unite_runtime_signals.severity IS 'Signal severity: info | warning | critical';
COMMENT ON COLUMN unite_runtime_signals.metric_value IS 'Current metric value';
COMMENT ON COLUMN unite_runtime_signals.threshold_value IS 'Threshold that was exceeded (if applicable)';
COMMENT ON COLUMN unite_runtime_signals.metadata IS 'Additional context: {source_id, region, environment}';

-- ============================================================================
-- ADAPTIVE STRATEGIES (AI-powered runtime strategies)
-- ============================================================================

DROP TABLE IF EXISTS unite_adaptive_strategies CASCADE;

CREATE TABLE unite_adaptive_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  evaluation_mode text NOT NULL CHECK (evaluation_mode IN ('side-effect-free', 'commit')),
  priority int DEFAULT 0,
  is_active boolean DEFAULT true,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_adaptive_strategies_tenant ON unite_adaptive_strategies(tenant_id);
CREATE INDEX idx_unite_adaptive_strategies_active ON unite_adaptive_strategies(is_active) WHERE is_active = true;
CREATE INDEX idx_unite_adaptive_strategies_priority ON unite_adaptive_strategies(priority DESC);

COMMENT ON TABLE unite_adaptive_strategies IS 'Adaptive runtime strategies with AI-powered decision making';
COMMENT ON COLUMN unite_adaptive_strategies.trigger_conditions IS 'Conditions to trigger strategy: {signal_type, severity, threshold}';
COMMENT ON COLUMN unite_adaptive_strategies.actions IS 'Actions to execute: [{type: "scale_up|throttle|alert", params: {}}]';
COMMENT ON COLUMN unite_adaptive_strategies.evaluation_mode IS 'Evaluation mode: side-effect-free (dry run) | commit (execute)';
COMMENT ON COLUMN unite_adaptive_strategies.priority IS 'Execution priority (higher = first)';

-- ============================================================================
-- ORCHESTRATOR RUNS (execution history)
-- ============================================================================

DROP TABLE IF EXISTS unite_orchestrator_runs CASCADE;

CREATE TABLE unite_orchestrator_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES unite_adaptive_strategies(id) ON DELETE CASCADE,
  triggered_by_signal_id uuid REFERENCES unite_runtime_signals(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('evaluating', 'executing', 'completed', 'failed', 'skipped')),
  evaluation_result jsonb,
  actions_taken jsonb,
  ai_reasoning text,
  side_effects_detected jsonb,
  tenant_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_unite_orchestrator_runs_strategy ON unite_orchestrator_runs(strategy_id);
CREATE INDEX idx_unite_orchestrator_runs_signal ON unite_orchestrator_runs(triggered_by_signal_id);
CREATE INDEX idx_unite_orchestrator_runs_tenant ON unite_orchestrator_runs(tenant_id);
CREATE INDEX idx_unite_orchestrator_runs_status ON unite_orchestrator_runs(status);
CREATE INDEX idx_unite_orchestrator_runs_started ON unite_orchestrator_runs(started_at DESC);

COMMENT ON TABLE unite_orchestrator_runs IS 'Orchestrator execution history and results';
COMMENT ON COLUMN unite_orchestrator_runs.status IS 'Execution status: evaluating → executing → completed/failed/skipped';
COMMENT ON COLUMN unite_orchestrator_runs.evaluation_result IS 'Side-effect-free evaluation outcome: {safe: boolean, predicted_impact: {}}';
COMMENT ON COLUMN unite_orchestrator_runs.actions_taken IS 'Actions executed: [{action: "scale_up", result: "success", timestamp}]';
COMMENT ON COLUMN unite_orchestrator_runs.ai_reasoning IS 'AI explanation of decision making process';
COMMENT ON COLUMN unite_orchestrator_runs.side_effects_detected IS 'Detected side effects: {warnings: [], impacts: []}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_runtime_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_adaptive_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_orchestrator_runs ENABLE ROW LEVEL SECURITY;

-- Runtime Signals
CREATE POLICY "Users can view runtime signals for their tenant"
  ON unite_runtime_signals FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage runtime signals for their tenant"
  ON unite_runtime_signals FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Adaptive Strategies
CREATE POLICY "Users can view adaptive strategies for their tenant"
  ON unite_adaptive_strategies FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage adaptive strategies for their tenant"
  ON unite_adaptive_strategies FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Orchestrator Runs
CREATE POLICY "Users can view orchestrator runs for their tenant"
  ON unite_orchestrator_runs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage orchestrator runs for their tenant"
  ON unite_orchestrator_runs FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
