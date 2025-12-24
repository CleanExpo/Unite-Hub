/**
 * Guardian I09: Performance & Cost Chaos Layer
 *
 * Defines tenant-scoped tables for load profiles, performance runs, and AI usage tracking.
 * All tables operate only on I01-I08 simulation/emulation flows; no writes to production runtime.
 * All metrics are tenant-isolated via RLS and must not contain PII or raw payloads.
 */

-- guardian_performance_profiles: Reusable load and SLO configurations
CREATE TABLE IF NOT EXISTS guardian_performance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  profile_type TEXT NOT NULL, -- 'burst' | 'steady' | 'spikey' | 'custom'
  target_entity_type TEXT NOT NULL, -- 'scenario' | 'regression_pack' | 'pipeline_phase'
  target_entity_id TEXT, -- e.g. scenario id or pack id

  -- Load configuration: RPS, concurrency, duration, warmup, pattern
  load_config JSONB NOT NULL, -- { rps?: number, concurrency?: number, durationSeconds: number, warmupSeconds?: number, pattern?: 'burst' | 'steady' | 'spikey' }

  -- SLO configuration: latency thresholds and error rate
  slo_config JSONB NOT NULL, -- { p95Ms?: number, maxMs?: number, errorRate?: number }

  -- AI budget (optional): token limits and cost limits
  ai_budget JSONB NOT NULL DEFAULT '{}'::jsonb, -- { maxTokens?: number, maxCostUsd?: number }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_performance_profiles_tenant_active
  ON guardian_performance_profiles(tenant_id, is_active DESC);

-- guardian_performance_runs: Individual performance test execution sessions
CREATE TABLE IF NOT EXISTS guardian_performance_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES guardian_performance_profiles(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed'

  -- Request metrics
  total_requests INTEGER NOT NULL DEFAULT 0,
  successful_requests INTEGER NOT NULL DEFAULT 0,
  failed_requests INTEGER NOT NULL DEFAULT 0,

  -- Latency statistics: overall and by phase
  latency_stats JSONB NOT NULL DEFAULT '{}'::jsonb, -- { overall: { p50: number, p95: number, max: number }, byPhase: { rule_eval: {...}, correlation: {...}, ... } }

  -- Error summary: counts by error type
  error_summary JSONB NOT NULL DEFAULT '{}'::jsonb, -- { [errorType: string]: number }

  -- AI usage during run
  ai_usage JSONB NOT NULL DEFAULT '{}'::jsonb, -- { totalTokens: number, calls: number, estimatedCostUsd: number }

  -- SLO result
  slo_result TEXT, -- 'pass' | 'fail' | 'inconclusive'

  -- Summary and error message
  summary JSONB,
  error_message TEXT,

  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_performance_runs_tenant_profile_date
  ON guardian_performance_runs(tenant_id, profile_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_runs_tenant_status
  ON guardian_performance_runs(tenant_id, status);

-- guardian_ai_usage_windows: Aggregate AI token usage per time window and context
CREATE TABLE IF NOT EXISTS guardian_ai_usage_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  context TEXT NOT NULL, -- 'qa_simulation' | 'playbook_sim' | 'training' | 'gatekeeper' | 'performance'

  -- Aggregate usage
  total_tokens BIGINT NOT NULL DEFAULT 0,
  total_calls INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC NOT NULL DEFAULT 0,

  -- Budget constraints
  budget_limit JSONB, -- { maxTokens?: number, maxCostUsd?: number }
  budget_state TEXT NOT NULL DEFAULT 'ok', -- 'ok' | 'warning' | 'exceeded'

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_windows_tenant_context_window
  ON guardian_ai_usage_windows(tenant_id, context, window_start DESC, window_end DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_windows_budget_state
  ON guardian_ai_usage_windows(tenant_id, budget_state)
  WHERE budget_state != 'ok';

-- Row-level security for performance profiles
ALTER TABLE guardian_performance_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "performance_profiles_tenant_isolation" ON guardian_performance_profiles;
CREATE POLICY "performance_profiles_tenant_isolation" ON guardian_performance_profiles
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

-- Row-level security for performance runs
ALTER TABLE guardian_performance_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "performance_runs_tenant_isolation" ON guardian_performance_runs;
CREATE POLICY "performance_runs_tenant_isolation" ON guardian_performance_runs
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

-- Row-level security for AI usage windows
ALTER TABLE guardian_ai_usage_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_windows_tenant_isolation" ON guardian_ai_usage_windows;
CREATE POLICY "ai_usage_windows_tenant_isolation" ON guardian_ai_usage_windows
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

-- View for recent performance runs per profile
CREATE OR REPLACE VIEW guardian_performance_runs_recent AS
SELECT
  r.id,
  r.tenant_id,
  r.profile_id,
  p.name AS profile_name,
  p.profile_type,
  r.started_at,
  r.finished_at,
  r.status,
  r.total_requests,
  r.successful_requests,
  r.failed_requests,
  r.slo_result,
  r.ai_usage,
  r.created_at
FROM guardian_performance_runs r
JOIN guardian_performance_profiles p ON r.profile_id = p.id
WHERE r.created_at >= NOW() - INTERVAL '30 days'
ORDER BY r.started_at DESC;

-- View for AI usage summary per context
CREATE OR REPLACE VIEW guardian_ai_usage_summary AS
SELECT
  tenant_id,
  context,
  SUM(total_tokens) AS total_tokens,
  SUM(total_calls) AS total_calls,
  SUM(estimated_cost_usd) AS total_cost_usd,
  MAX(budget_state) AS worst_budget_state,
  MIN(window_start) AS window_start,
  MAX(window_end) AS window_end
FROM guardian_ai_usage_windows
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id, context;
